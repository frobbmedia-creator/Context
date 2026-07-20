#!/usr/bin/env node
/**
 * Context CLI — local-first git-aware context packs for LLMs
 * v0.3.1
 */
import { Command } from 'commander';
import path from 'node:path';
import { packWorkspace, watchWorkspace, printStatus } from '../src/cli-core.js';
import { startMcpServer } from '../src/mcp-server.js';
import { checkProAccess, printTrialInfo, generateInviteCode, formatInviteMessage } from '../src/trial.js';

const version = '0.3.1';
const program = new Command();

program
  .name('context')
  .description('Local-first, git-aware context packs for LLMs. Zero upload.')
  .version(version)
  .showHelpAfterError('(add --help for usage)');

program
  .command('pack')
  .description('One-shot pack (always free)')
  .argument('[dir]', 'workspace', '.')
  .option('-b, --budget <tokens>', 'token budget', '128000')
  .option('-r, --reserved <tokens>', 'reserved for your prompt', '4000')
  .option('-m, --model <name>', 'claude | gpt-5 | generic | tiktoken', 'claude')
  .option('-c, --compression <mode>', 'structural | compact | full | summary', 'structural')
  .option('-f, --format <fmt>', 'xml | json', 'xml')
  .option('-o, --out <target>', 'stdout | clipboard | <file>', 'stdout')
  .option('-p, --prompt <text>', 'task description to append')
  .option('--include-omitted', 'include omitted-files audit', false)
  .option('--no-git', 'disable git prioritization')
  .option('--ignore <patterns...>', 'extra ignore patterns')
  .action(async (dir, opts) => {
    try {
      const result = await packWorkspace(path.resolve(dir), {
        budget: Number(opts.budget),
        reserved: Number(opts.reserved),
        model: opts.model,
        compression: opts.compression,
        format: opts.format,
        prompt: opts.prompt || '',
        includeOmitted: opts.includeOmitted,
        useGit: opts.git !== false,
        extraIgnore: opts.ignore || []
      });
      await writeOutput(result.content, opts.out);
      if (opts.out !== 'stdout') {
        const scoreBit = result.score ? ` · Score ${result.score.score}/100` : '';
        console.error(`✓ ${result.stats.included} files · ${result.stats.tokens} tokens · ${result.stats.saved} saved${scoreBit}`);
      }
    } catch (err) {
      console.error('Error:', err.message);
      process.exit(1);
    }
  });

program
  .command('watch')
  .description('Live re-pack on save → clipboard (14-day free Pro trial)')
  .argument('[dir]', 'workspace', '.')
  .option('-b, --budget <tokens>', 'token budget', '128000')
  .option('-r, --reserved <tokens>', 'reserved for your prompt', '4000')
  .option('-m, --model <name>', 'claude | gpt-5 | generic | tiktoken', 'claude')
  .option('-c, --compression <mode>', 'structural | compact | full | summary', 'structural')
  .option('-f, --format <fmt>', 'xml | json', 'xml')
  .option('-o, --out <target>', 'clipboard | <file>', 'clipboard')
  .option('-p, --prompt <text>', 'task description')
  .option('--debounce <ms>', 'debounce after last change', '400')
  .action(async (dir, opts) => {
    const access = await checkProAccess('watch');
    if (access.message) console.error(access.message);
    if (!access.allowed) process.exit(1);

    console.error(`watch · ${path.resolve(dir)} · budget ${opts.budget} · ${opts.model}`);
    await watchWorkspace(path.resolve(dir), {
      budget: Number(opts.budget),
      reserved: Number(opts.reserved),
      model: opts.model,
      compression: opts.compression,
      format: opts.format,
      prompt: opts.prompt || '',
      out: opts.out,
      debounceMs: Number(opts.debounce)
    });
  });

program
  .command('status')
  .description('Git-aware priorities + trial status')
  .argument('[dir]', 'workspace', '.')
  .option('-m, --model <name>', 'tokenizer profile', 'claude')
  .action(async (dir, opts) => {
    await printTrialInfo();
    console.error('');
    await printStatus(path.resolve(dir), { model: opts.model });
  });

program
  .command('trial')
  .description('Show Pro trial / license status')
  .action(async () => {
    await printTrialInfo();
  });

program
  .command('invite')
  .description('Generate a shareable invite')
  .action(async () => {
    const code = await generateInviteCode();
    console.log(formatInviteMessage(code));
  });

program
  .command('mcp')
  .description('Start MCP server (stdio) for agents')
  .option('--workspace <dir>', 'default workspace', '.')
  .action(async (opts) => {
    await startMcpServer(path.resolve(opts.workspace));
  });

// Default: show help (clean first impression)
if (process.argv.length <= 2) {
  program.help();
}

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
      console.error('✓ clipboard');
    } catch {
      console.error('clipboard unavailable — writing to stdout');
      process.stdout.write(content);
    }
    return;
  }
  const fs = await import('node:fs/promises');
  await fs.writeFile(target, content, 'utf8');
  console.error(`✓ wrote ${target}`);
}
