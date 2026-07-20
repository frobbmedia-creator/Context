import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildXml, buildJson } from '../src/export.js';

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
});
