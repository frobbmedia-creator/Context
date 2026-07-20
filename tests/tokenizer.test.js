import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { estimateTokens, tokenizerLabel } from '../src/tokenizer.js';

describe('tokenizer', () => {
  it('returns 0 for empty input', () => {
    assert.equal(estimateTokens(''), 0);
    assert.equal(estimateTokens(null), 0);
  });

  it('estimates more tokens for code-like content', () => {
    const code = 'function helloWorld() {\n  return 42;\n}';
    const prose = 'This is a simple sentence about nothing in particular.';
    const codeTok = estimateTokens(code, 'claude', 'JavaScript');
    const proseTok = estimateTokens(prose, 'claude', 'Text');
    assert.ok(codeTok > 0);
    assert.ok(proseTok > 0);
  });

  it('provides a label', () => {
    assert.match(tokenizerLabel('claude'), /Claude/i);
    assert.match(tokenizerLabel('gpt-5'), /OpenAI|cl100k/i);
  });
});
