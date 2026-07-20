#!/usr/bin/env node
/**
 * Context CLI v0.2.2 — reliable bin entry
 */
import { Command } from 'commander';
import path from 'node:path';
import { packWorkspace, watchWorkspace, printStatus } from '../src/cli-core.js';
import { startMcpServer } from '../src/mcp-server.js';

const version = '0.2.2';
const program = new Command();

program
  .name('context')
  .description('Local-first, Git-aware workspace compressor → LLM-ready XML/JSON')
  .version(version);

program
  .command('pack')
  .description('Pack a workspace into structured XML or JSON for an LLM')
  .argument('[dir]', 'Workspace directory', '.')
  .option('-b, --budget <tokens>', 'Total token budget', '128000')
  .option('-r, --reserved <tokens>', 'Reserved tokens for the user prompt', '4000')
  .option('-m, --model <name>', 'Tokenizer profile: gpt-5 | claude | generic | tiktoken', 'claude')
  .option('-c, --compression <mode>', 'full | compact | structural | summary', 'structural')
  .option('-f, --format <fmt>', 'xml | json', 'xml')
  .option('-o, --out <target>', 'stdout | clipboard | <file>', 'stdout')
  .option('-p, --prompt <text>', 'User task prompt to append', '')
  .option('--include-omitted', 'Include omitted-files audit section', false)
  .option('--no-git', 'Disable git status prioritization')
  .option('--ignore <patterns...>', 'Extra ignore patterns')
  .action(async (dir, opts) => {
    try {
      const result = await packWorkspace(path.resolve(dir), {
        budget: Number(opts.budget),
        reserved: Number(opts.reserved),
        model: opts.model,
        compression: opts.compression,
        format: opts.format,
        prompt: opts.prompt,
        includeOmitted: opts.includeOmitted,
        useGit: opts.git !== false,
        extraIgnore: opts.ignore || []
      });
      await writeOutput(result.content, opts.out);
      if (opts.out !== 'stdout') {
        console.error(`✓ Packed ${result.stats.included} files · ${result.stats.tokens} tokens · ${result.stats.saved} saved`);
      }
    } catch (err) {
      console.error('Error:', err.message);
      process.exit(1);
    }
  });

program
  .command('watch')
  .description('Watch workspace and re-pack on changes')
  .argument('[dir]', 'Workspace directory', '.')
  .option('-b, --budget <tokens>', 'Total token budget', '128000')
  .option('-r, --reserved <tokens>', 'Reserved tokens', '4000')
  .option('-m, --model <name>', 'Tokenizer profile', 'claude')
  .option('-c, --compression <mode>', 'Compression mode', 'structural')
  .option('-f, --format <fmt>', 'xml | json', 'xml')
  .option('-o, --out <target>', 'clipboard | <file>', 'clipboard')
  .option('-p, --prompt <text>', 'User task prompt', '')
  .option('--debounce <ms>', 'Debounce ms after last change', '400')
  .action(async (dir, opts) => {
    console.error(`Context watch · ${path.resolve(dir)} · budget ${opts.budget} · ${opts.model}`);
    await watchWorkspace(path.resolve(dir), {
      budget: Number(opts.budget),
      reserved: Number(opts.reserved),
      model: opts.model,
      compression: opts.compression,
      format: opts.format,
      prompt: opts.prompt,
      out: opts.out,
      debounceMs: Number(opts.debounce)
    });
  });

program
  .command('status')
  .description('Show git-aware file priorities and estimated tokens')
  .argument('[dir]', 'Workspace directory', '.')
  .option('-m, --model <name>', 'Tokenizer profile', 'claude')
  .action(async (dir, opts) => {
    await printStatus(path.resolve(dir), { model: opts.model });
  });

program
  .command('mcp')
  .description('Start experimental MCP server (stdio)')
  .option('--workspace <dir>', 'Default workspace root', '.')
  .action(async (opts) => {
    await startMcpServer(path.resolve(opts.workspace));
  });

program.parse();

async function writeOutput(content, target) {
  if (target === 'stdout') {
    process.stdout.write(content);
    return;
  }
  if (target === 'clipboard') {
    try {
      const clipboardy = await import('clipboardy');
      await clipboardy.default.write(content);
      console.error('✓ Copied to clipboard');
    } catch {
      console.error('clipboardy not available — falling back to stdout');
      process.stdout.write(content);
    }
    return;
  }
  const fs = await import('node:fs/promises');
  await fs.writeFile(target, content, 'utf8');
  console.error(`✓ Wrote ${target}`);
}
