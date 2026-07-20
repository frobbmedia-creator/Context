/**
 * Context CLI Core — Git-aware packing engine
 * Ports and upgrades the original browser worker logic to Node with real git.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createIgnore } from 'ignore';
import fg from 'fast-glob';
import { estimateTokens, tokenizerLabel } from './tokenizer.js';
import { transformText } from './compressor.js';
import { buildXml, buildJson } from './export.js';

const exec = promisify(execFile);

const BINARY_EXT = /\.(png|jpe?g|gif|webp|ico|pdf|zip|gz|tar|tgz|mp4|mov|mp3|wav|woff2?|ttf|otf|wasm|exe|dll|dylib|so|bin)$/i;
const MAX_TEXT_BYTES = 1_500_000;

/**
 * Real git status via porcelain. Priority:
 *  100 = modified / staged / untracked (working tree changes)
 *   60 = tracked clean
 *   20 = other
 */
export async function getGitPriorities(root) {
  const map = new Map();
  try {
    // Ensure we are inside a git work tree
    await exec('git', ['rev-parse', '--is-inside-work-tree'], { cwd: root });

    const { stdout } = await exec('git', ['status', '--porcelain=v1', '-u'], { cwd: root, maxBuffer: 20 * 1024 * 1024 });
    for (const line of stdout.split('\n')) {
      if (!line || line.length < 4) continue;
      const status = line.slice(0, 2);
      let filePath = line.slice(3).trim();
      // handle renames "R  old -> new"
      if (filePath.includes(' -> ')) filePath = filePath.split(' -> ').pop();
      // untracked starts with ??
      const isChange = status !== '  ' && status !== '!!';
      map.set(filePath.replace(/\\/g, '/'), isChange ? 100 : 60);
    }

    // Also mark all tracked files at least 60 if not already present
    const { stdout: ls } = await exec('git', ['ls-files'], { cwd: root, maxBuffer: 20 * 1024 * 1024 });
    for (const p of ls.split('\n')) {
      if (!p) continue;
      const norm = p.replace(/\\/g, '/');
      if (!map.has(norm)) map.set(norm, 60);
    }
  } catch {
    // not a git repo or git not available → empty map, fall back to mtime later
  }
  return map;
}

function isProbablyBinary(name, size) {
  if (BINARY_EXT.test(name)) return true;
  if (size > 8_000_000) return true;
  return false;
}

function inferLanguage(filePath) {
  const ext = path.extname(filePath).slice(1).toLowerCase();
  const map = {
    js: 'JavaScript', jsx: 'React', ts: 'TypeScript', tsx: 'React TypeScript',
    mjs: 'JavaScript', cjs: 'JavaScript',
    css: 'CSS', scss: 'CSS', html: 'HTML', md: 'Markdown', markdown: 'Markdown',
    json: 'JSON', yml: 'YAML', yaml: 'YAML', py: 'Python', rs: 'Rust',
    go: 'Go', java: 'Java', c: 'C', h: 'C/C++ Header', cpp: 'C++', hpp: 'C++ Header',
    rb: 'Ruby', php: 'PHP', swift: 'Swift', kt: 'Kotlin', sql: 'SQL',
    sh: 'Shell', bash: 'Shell', zsh: 'Shell', toml: 'TOML', xml: 'XML',
    vue: 'Vue', svelte: 'Svelte'
  };
  return map[ext] || 'Text';
}

async function loadGitignore(root) {
  const ig = createIgnore();
  try {
    const content = await fs.readFile(path.join(root, '.gitignore'), 'utf8');
    ig.add(content);
  } catch { /* no .gitignore */ }
  // always ignore common noise
  ig.add(['.git/', 'node_modules/', 'dist/', 'build/', '.next/', '.cache/', 'coverage/', '*.lock', '*.min.js', '*.map']);
  return ig;
}

export async function collectSources(root, { extraIgnore = [], useGit = true } = {}) {
  const ig = await loadGitignore(root);
  if (extraIgnore.length) ig.add(extraIgnore);

  const entries = await fg('**/*', {
    cwd: root,
    onlyFiles: true,
    dot: false,
    followSymbolicLinks: false,
    suppressErrors: true,
    absolute: false
  });

  const gitPrio = useGit ? await getGitPriorities(root) : new Map();
  const sources = [];

  for (const rel of entries) {
    const norm = rel.replace(/\\/g, '/');
    if (ig.ignores(norm)) continue;

    const abs = path.join(root, rel);
    let stat;
    try {
      stat = await fs.stat(abs);
    } catch { continue; }

    const binary = isProbablyBinary(rel, stat.size);
    let text = '';
    let warnings = [];

    if (!binary) {
      try {
        const buf = await fs.readFile(abs);
        if (buf.length > MAX_TEXT_BYTES) {
          text = buf.slice(0, MAX_TEXT_BYTES).toString('utf8');
          warnings.push('sampled-large-file');
        } else {
          text = buf.toString('utf8');
        }
      } catch {
        warnings.push('read-error');
      }
    }

    const language = inferLanguage(rel);
    const priority = gitPrio.get(norm) ?? (stat.mtimeMs > Date.now() - 86400000 ? 80 : 20);

    sources.push({
      path: norm,
      name: path.basename(rel),
      size: stat.size,
      mtime: stat.mtimeMs,
      language,
      binary,
      priority,
      text,
      warnings
    });
  }

  return sources;
}

export async function analyzeAndPack(sources, options) {
  const {
    budget = 128000,
    reserved = 4000,
    model = 'claude',
    compression = 'structural',
    format = 'xml',
    prompt = '',
    includeOmitted = true
  } = options;

  const available = Math.max(0, budget - reserved);
  const records = [];

  for (const src of sources) {
    if (src.binary) {
      records.push({
        ...src,
        tokens: 0,
        fullTokens: 0,
        content: '',
        contentHash: '',
        included: false,
        ignoreReason: 'binary-file'
      });
      continue;
    }

    const compressed = transformText(src.text, compression, src.language);
    const tokens = estimateTokens(compressed, model, src.language);
    const fullTokens = estimateTokens(src.text, model, src.language);
    // simple sha256 via webcrypto if available, else skip
    let contentHash = '';
    try {
      const { createHash } = await import('node:crypto');
      contentHash = createHash('sha256').update(src.text).digest('hex');
    } catch { /* ignore */ }

    records.push({
      path: src.path,
      name: src.name,
      size: src.size,
      mtime: src.mtime,
      language: src.language,
      binary: false,
      priority: src.priority,
      tokens,
      fullTokens,
      content: compressed,
      contentHash,
      hashScope: src.warnings.includes('sampled-large-file') ? 'sampled-text' : 'full-text',
      warnings: src.warnings,
      tokenizer: tokenizerLabel(model),
      compressor: 'Context structural compressor v2',
      compression,
      included: false
    });
  }

  // Greedy pack by priority desc, then tokens asc
  const ranked = [...records]
    .filter(r => !r.binary)
    .sort((a, b) => b.priority - a.priority || a.tokens - b.tokens);

  let used = 0;
  const includeSet = new Set();
  for (const r of ranked) {
    if (used + r.tokens <= available) {
      used += r.tokens;
      includeSet.add(r.path);
    }
  }

  for (const r of records) {
    r.included = includeSet.has(r.path);
  }

  const included = records.filter(r => r.included);
  const omitted = records.filter(r => !r.included);
  const tokens = included.reduce((s, r) => s + r.tokens, 0);
  const saved = included.reduce((s, r) => s + Math.max(0, (r.fullTokens || 0) - r.tokens), 0);

  const content = format === 'json'
    ? buildJson({ records: included, omitted, budget, reserved, available, used: tokens, saved, prompt, model })
    : buildXml({ records: included, omitted, budget, reserved, tokens, prompt, includeOmitted });

  return {
    content,
    stats: {
      total: records.length,
      included: included.length,
      omitted: omitted.length,
      tokens,
      saved,
      available
    },
    records
  };
}

export async function packWorkspace(root, options = {}) {
  const sources = await collectSources(root, options);
  return analyzeAndPack(sources, options);
}

export async function watchWorkspace(root, options = {}) {
  const chokidar = (await import('chokidar')).default;
  let timer = null;
  let packing = false;

  const run = async () => {
    if (packing) return;
    packing = true;
    try {
      const result = await packWorkspace(root, options);
      // dynamic import to avoid top-level if clipboard not needed
      if (options.out === 'clipboard') {
        try {
          const clipboardy = (await import('clipboardy')).default;
          await clipboardy.write(result.content);
          console.error(`[${new Date().toLocaleTimeString()}] ✓ ${result.stats.included} files · ${result.stats.tokens} tok → clipboard`);
        } catch (e) {
          console.error('Clipboard failed:', e.message);
        }
      } else if (options.out && options.out !== 'stdout') {
        await fs.writeFile(options.out, result.content, 'utf8');
        console.error(`[${new Date().toLocaleTimeString()}] ✓ wrote ${options.out}`);
      } else {
        process.stdout.write(result.content + '\n');
      }
    } catch (err) {
      console.error('Pack error:', err.message);
    } finally {
      packing = false;
    }
  };

  // initial
  await run();

  const watcher = chokidar.watch(root, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 50 }
  });

  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(run, options.debounceMs || 400);
  };

  watcher.on('add', schedule).on('change', schedule).on('unlink', schedule);

  process.on('SIGINT', () => {
    watcher.close();
    process.exit(0);
  });
}

export async function printStatus(root, { model = 'claude' } = {}) {
  const sources = await collectSources(root, { useGit: true });
  const gitPrio = await getGitPriorities(root);

  console.log(`Context status · ${root}`);
  console.log(`Files scanned: ${sources.length}`);
  console.log('');

  const byPrio = { 100: [], 80: [], 60: [], 20: [] };
  for (const s of sources) {
    const p = s.priority;
    if (p >= 100) byPrio[100].push(s);
    else if (p >= 80) byPrio[80].push(s);
    else if (p >= 60) byPrio[60].push(s);
    else byPrio[20].push(s);
  }

  for (const [prio, list] of Object.entries(byPrio)) {
    if (!list.length) continue;
    const label = { 100: 'CHANGED (git)', 80: 'RECENT', 60: 'TRACKED', 20: 'OTHER' }[prio];
    console.log(`── ${label} (${list.length}) ──`);
    for (const s of list.slice(0, 30)) {
      const tok = s.binary ? 'binary' : estimateTokens(s.text.slice(0, 4000), model, s.language);
      console.log(`  ${String(prio).padStart(3)}  ${tok.toString().padStart(6)} tok  ${s.path}`);
    }
    if (list.length > 30) console.log(`  … +${list.length - 30} more`);
    console.log('');
  }
}
