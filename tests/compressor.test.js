import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { transformText } from '../src/compressor.js';

describe('compressor', () => {
  it('full mode returns normalized text', () => {
    const input = 'hello\r\nworld\u0000';
    const out = transformText(input, 'full');
    assert.equal(out, 'hello\nworld');
  });

  it('structural mode elides JS function bodies', () => {
    const input = `
import { foo } from 'bar';
export function greet(name) {
  console.log('hello ' + name);
  return true;
}
`;
    const out = transformText(input, 'structural', 'JavaScript');
    assert.match(out, /import/);
    assert.match(out, /function greet/);
    assert.match(out, /\/\* \.\.\. \*\//);
  });

  it('summary keeps important lines', () => {
    const input = '# Title\n\nsome text\nfunction test() {}\nmore text';
    const out = transformText(input, 'summary');
    assert.match(out, /# Title|function test/);
  });
});
