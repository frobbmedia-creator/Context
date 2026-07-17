import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

async function loadBrowserScript(path) {
  const source = await readFile(new URL(path, import.meta.url), "utf8");
  const sandbox = {
    self: {},
    TextEncoder,
    Set,
    RegExp,
    Math,
    Array,
    Object,
    String,
    Number,
    Boolean
  };
  sandbox.self = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: path });
  return sandbox;
}

const tokenizerSandbox = await loadBrowserScript("../tokenizer.js");
const compressorSandbox = await loadBrowserScript("../compressor.js");

const { ContextTokenizer } = tokenizerSandbox;
const { ContextCompressor } = compressorSandbox;

assert.equal(typeof ContextTokenizer.estimateTokens, "function");
assert.equal(typeof ContextCompressor.transformText, "function");

const code = `
import { readFile } from "node:fs/promises";

export interface User {
  id: string;
  name: string;
}

export function greet(user: User) {
  const message = "hello " + user.name;
  return message;
}
`;

const full = ContextCompressor.transformText(code, "full", "TypeScript");
const structural = ContextCompressor.transformText(code, "structural", "TypeScript");
const summary = ContextCompressor.transformText(code, "summary", "TypeScript");

assert.ok(full.includes("return message"));
assert.ok(structural.includes("import { readFile }"));
assert.ok(structural.includes("export interface User"));
assert.ok(structural.includes("export function greet"));
assert.ok(!structural.includes("const message"));
assert.ok(summary.includes("export interface User"));

const fullTokens = ContextTokenizer.estimateTokens(full, "gpt-5", "TypeScript");
const structuralTokens = ContextTokenizer.estimateTokens(structural, "gpt-5", "TypeScript");

assert.ok(fullTokens > 0);
assert.ok(structuralTokens > 0);
assert.ok(structuralTokens < fullTokens);

console.log("unit-tests: ok");
