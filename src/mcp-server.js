/**
 * Context MCP server (stdio) — hardened for agent use
 * v0.3.1
 *
 * Practical line protocol agents can call immediately:
 *   PACK [dir] [budget] [model] [compression]
 *   STATUS [dir]
 *   SCORE [dir]
 *   PING
 *   HELP
 *
 * Future: full JSON-RPC MCP tools/list + tools/call.
 */

import { packWorkspace } from './cli-core.js';
import { formatScoreLine } from './score.js';
import readline from 'node:readline';
import path from 'node:path';

export async function startMcpServer(defaultWorkspace = '.') {
  const root = path.resolve(defaultWorkspace);
  console.error('Context MCP server v0.3.1 listening on stdio…');
  console.error(`Default workspace: ${root}`);
  console.error('Commands: PACK | STATUS | SCORE | PING | HELP');

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false });

  rl.on('line', async (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    try {
      const [cmd, ...args] = trimmed.split(/\s+/);
      const command = cmd.toUpperCase();

      if (command === 'PING') {
        process.stdout.write('PONG\n');
        return;
      }

      if (command === 'HELP') {
        process.stdout.write(
          [
            'Context MCP commands:',
            '  PACK [dir] [budget=128000] [model=claude] [compression=structural]',
            '  STATUS [dir]',
            '  SCORE [dir]',
            '  PING',
            '  HELP',
            'After PACK the full XML is written followed by ---END---'
          ].join('\n') + '\n'
        );
        return;
      }

      if (command === 'PACK') {
        const dir = args[0] ? path.resolve(args[0]) : root;
        const budget = Number(args[1]) || 128000;
        const model = args[2] || 'claude';
        const compression = args[3] || 'structural';

        const result = await packWorkspace(dir, {
          budget,
          reserved: 4000,
          model,
          compression,
          format: 'xml',
          prompt: 'MCP agent requested context pack',
          includeOmitted: true
        });

        process.stdout.write(result.content);
        process.stdout.write('\n---END---\n');
        if (result.score) {
          console.error(formatScoreLine(result.score));
        }
        return;
      }

      if (command === 'STATUS') {
        const dir = args[0] ? path.resolve(args[0]) : root;
        const result = await packWorkspace(dir, {
          budget: 8000,
          reserved: 500,
          model: 'claude',
          compression: 'structural',
          format: 'json'
        });
        process.stdout.write(
          JSON.stringify(
            {
              workspace: dir,
              files: result.stats.total,
              included: result.stats.included,
              tokens: result.stats.tokens,
              saved: result.stats.saved,
              score: result.score
            },
            null,
            2
          ) + '\n---END---\n'
        );
        return;
      }

      if (command === 'SCORE') {
        const dir = args[0] ? path.resolve(args[0]) : root;
        const result = await packWorkspace(dir, {
          budget: 128000,
          reserved: 4000,
          model: 'claude',
          compression: 'structural',
          format: 'json'
        });
        process.stdout.write(JSON.stringify(result.score || {}, null, 2) + '\n---END---\n');
        return;
      }

      process.stdout.write(`Unknown command "${cmd}". Send HELP\n`);
    } catch (err) {
      process.stdout.write(`ERROR: ${err.message}\n---END---\n`);
    }
  });
}
