import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { buildXml, buildJson } from '../src/export.js';
import { APP_VERSION as VERSION_FROM_SRC } from '../src/version.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(resolve(__dirname, '..', 'package.json'), 'utf8'));
const VERSION_FROM_PKG = pkg.version;

describe('export', () => {
  const sampleRecords = [{
    path: 'src/hello.js',
    language: 'JavaScript',
    tokens: 42,
    content: 'export function hello() { return "world"; }',
    contentHash: 'abc123',
    hashScope: 'full-text',
    tokenizer: 'test',
    compressor: 'test',
    compression: 'structural',
    warnings: []
  }];

  it('buildXml produces valid structure', () => {
    const xml = buildXml({
      records: sampleRecords,
      omitted: [],
      budget: 128000,
      reserved: 4000,
      tokens: 42,
      prompt: 'Say hello'
    });
    assert.match(xml, /<context_bundle/);
    assert.match(xml, /path="src\/hello.js"/);
    assert.match(xml, /<!\[CDATA\[/);
    assert.match(xml, /Say hello/);
  });

  it('buildJson produces valid schema', () => {
    const json = JSON.parse(buildJson({
      records: sampleRecords,
      omitted: [],
      budget: 128000,
      reserved: 4000,
      available: 124000,
      used: 42,
      saved: 10,
      prompt: 'test',
      model: 'claude'
    }));
    assert.equal(json.schema, 'context.bundle.v1');
    assert.equal(json.files.length, 1);
    assert.equal(json.files[0].path, 'src/hello.js');
  });

  it('bundle version matches package.json (no drift)', () => {
    // regression: APP_VERSION was hardcoded '0.2.0' while package.json advanced.
    // src/version.js now reads from package.json — these must always agree.
    assert.equal(VERSION_FROM_SRC, VERSION_FROM_PKG, 'src/version.js must mirror package.json');
    const xml = buildXml({ records: sampleRecords, omitted: [], budget: 128000, reserved: 4000, tokens: 42, prompt: 'x' });
    assert.match(xml, new RegExp(`version="${VERSION_FROM_PKG}"`), 'XML bundle must carry package.json version');
    const json = JSON.parse(buildJson({ records: sampleRecords, omitted: [], budget: 128000, reserved: 4000, available: 124000, used: 42, saved: 0, prompt: 'x', model: 'claude' }));
    assert.equal(json.app.version, VERSION_FROM_PKG, 'JSON bundle must carry package.json version');
  });
});
