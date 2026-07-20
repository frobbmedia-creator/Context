/**
 * Minimal MCP (Model Context Protocol) server over stdio
 * Allows agents (Claude Desktop, Cursor, etc.) to request a packed context.
 *
 * Protocol is simplified for v0.2 — full JSON-RPC MCP can be expanded later.
 */

import { packWorkspace } from './cli-core.js';
import readline from 'node:readline';

export async function startMcpServer(defaultWorkspace = '.') {
  console.error('Context MCP server listening on stdio…');
  console.error(`Default workspace: ${defaultWorkspace}`);

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false });

  // Very lightweight request/response for demonstration.
  // Real MCP would speak the full JSON-RPC 2.0 + tools/list etc.
  // Here we accept a simple line protocol for immediate usefulness:
  //   PACK <dir> <budget> <model>
  // returns the packed XML on the next line(s) then a ---END--- marker.

  rl.on('line', async (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    try {
      if (trimmed.startsWith('PACK ')) {
        const parts = trimmed.slice(5).trim().split(/\s+/);
        const dir = parts[0] || defaultWorkspace;
        const budget = Number(parts[1]) || 128000;
        const model = parts[2] || 'claude';

        const result = await packWorkspace(dir, {
          budget,
          reserved: 4000,
          model,
          compression: 'structural',
          format: 'xml',
          prompt: 'Agent requested context pack'
        });

        process.stdout.write(result.content);
        process.stdout.write('\n---END---\n');
      } else if (trimmed === 'PING') {
        process.stdout.write('PONG\n');
      } else if (trimmed === 'HELP') {
        process.stdout.write('Commands: PACK <dir> [budget] [model] | PING | HELP\n');
      } else {
        process.stdout.write(`Unknown command. Send HELP\n`);
      }
    } catch (err) {
      process.stdout.write(`ERROR: ${err.message}\n---END---\n`);
    }
  });
}
