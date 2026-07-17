const CACHE_DB = "context-cache";
const CACHE_STORE = "file-metadata";
const MAX_TEXT_BYTES = 1_500_000;
const HASH_VERSION = "sha256-text-v1";

importScripts("./tokenizer.js?v=14");
importScripts("./compressor.js?v=14");

let dbPromise;

self.onmessage = async (event) => {
  const { type, payload } = event.data;
  try {
    if (type === "index-files") {
      await indexFiles(payload);
    } else if (type === "clear-cache") {
      await clearCache();
      postMessage({ type: "cache-cleared" });
    }
  } catch (error) {
    postMessage({ type: "worker-error", error: error.message || String(error) });
  }
};

async function indexFiles({ files, model, compression }) {
  const total = files.length || 1;
  const results = [];
  let cached = 0;

  for (let index = 0; index < files.length; index += 1) {
    const source = files[index];
    const fingerprint = buildFingerprint(source, model, compression);
    const cachedRecord = await getCached(fingerprint);

    if (cachedRecord) {
      cached += 1;
      results.push({ ...cachedRecord, cached: true });
    } else {
      const record = await analyzeSource(source, model, compression, fingerprint);
      await setCached(fingerprint, record);
      results.push(record);
    }

    if (index % 8 === 0 || index === files.length - 1) {
      postMessage({
        type: "progress",
        complete: index + 1,
        total,
        cached
      });
    }
  }

  await writeOpfsSnapshot(results);
  postMessage({ type: "indexed", records: results, cached });
}

async function analyzeSource(source, model, compression, fingerprint) {
  const binary = isProbablyBinary(source.name, source.type, source.size);
  let text = "";
  let warnings = [];

  if (!binary) {
    text = await readSourceText(source);
    if (text.length > MAX_TEXT_BYTES) {
      text = text.slice(0, MAX_TEXT_BYTES);
      warnings.push("sampled-large-file");
    }
  }

  const language = inferLanguage(source.path);
  const contentHash = text ? await sha256Hex(text) : "";
  const hashScope = warnings.includes("sampled-large-file") ? "sampled-text" : binary ? "not-hashed-binary" : "full-text";
  const compressed = ContextCompressor.transformText(text, compression, language);
  const tokens = ContextTokenizer.estimateTokens(compressed, model, language);
  const fullTokens = ContextTokenizer.estimateTokens(text, model, language);

  return {
    cacheKey: fingerprint,
    path: source.path,
    name: source.name,
    size: source.size,
    mtime: source.mtime,
    type: source.type,
    language,
    binary,
    ignored: source.ignored,
    ignoreReason: source.ignoreReason,
    contentHash,
    hashAlgorithm: contentHash ? "sha-256" : "",
    hashScope,
    tokens,
    fullTokens,
    tokenizer: ContextTokenizer.tokenizerLabel(model),
    tokenizerVersion: ContextTokenizer.TOKENIZER_VERSION,
    compressor: "Context structural compressor",
    compressorVersion: ContextCompressor.COMPRESSOR_VERSION,
    compression,
    priority: scoreSource(source.path, language, source.size),
    content: compressed,
    originalSample: text.slice(0, 1200),
    warnings,
    cached: false
  };
}

function buildFingerprint(source, model, compression) {
  return [ContextTokenizer.TOKENIZER_VERSION, ContextCompressor.COMPRESSOR_VERSION, HASH_VERSION, source.path, source.size, source.mtime || 0, model, compression].join("|");
}

async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function readSourceText(source) {
  if (source.file) {
    return source.file.text();
  }
  if (source.text != null) {
    return source.text;
  }
  return "";
}

function isProbablyBinary(name, type, size) {
  const lower = name.toLowerCase();
  const binaryExt = /\.(png|jpe?g|gif|webp|ico|pdf|zip|gz|tar|tgz|mp4|mov|mp3|wav|woff2?|ttf|otf|wasm|exe|dll|dylib|so)$/;
  if (binaryExt.test(lower)) return true;
  if (size > 8_000_000 && !/\.(txt|md|json|js|ts|tsx|jsx|css|html|xml|yaml|yml|rs|go|py|java|c|cpp|h|hpp)$/i.test(lower)) {
    return true;
  }
  return type.startsWith("image/") || type.startsWith("audio/") || type.startsWith("video/");
}

function inferLanguage(path) {
  const ext = path.split(".").pop()?.toLowerCase() || "";
  const map = {
    js: "JavaScript",
    jsx: "React",
    ts: "TypeScript",
    tsx: "React TypeScript",
    css: "CSS",
    html: "HTML",
    md: "Markdown",
    json: "JSON",
    yml: "YAML",
    yaml: "YAML",
    py: "Python",
    rs: "Rust",
    go: "Go",
    java: "Java",
    c: "C",
    h: "C/C++ Header",
    cpp: "C++",
    hpp: "C++ Header",
    rb: "Ruby",
    php: "PHP",
    swift: "Swift",
    kt: "Kotlin",
    sql: "SQL",
    sh: "Shell",
    toml: "TOML",
    xml: "XML"
  };
  return map[ext] || "Text";
}

function scoreSource(path, language, size) {
  const lower = path.toLowerCase();
  let score = 50;
  if (/readme|package\.json|pyproject|cargo\.toml|go\.mod|architecture|spec|prd/.test(lower)) score += 30;
  if (/\b(src|app|lib|server|api|components)\b/.test(lower)) score += 18;
  if (/test|spec|fixture|mock/.test(lower)) score -= 8;
  if (/lock|generated|vendor|dist|build/.test(lower)) score -= 35;
  if (language === "Markdown") score += 8;
  if (size > 300_000) score -= 18;
  return Math.max(1, Math.min(100, score));
}

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(CACHE_DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(CACHE_STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

async function getCached(key) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CACHE_STORE, "readonly");
    const request = tx.objectStore(CACHE_STORE).get(key);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

async function setCached(key, value) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CACHE_STORE, "readwrite");
    tx.objectStore(CACHE_STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function clearCache() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CACHE_STORE, "readwrite");
    tx.objectStore(CACHE_STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function writeOpfsSnapshot(records) {
  if (!navigator.storage?.getDirectory) return;
  try {
    const root = await navigator.storage.getDirectory();
    const handle = await root.getFileHandle("context-index-snapshot.json", { create: true });
    const payload = JSON.stringify({
      generatedAt: new Date().toISOString(),
      records: records.map(({ content, originalSample, ...record }) => record)
    });
    const encoded = new TextEncoder().encode(payload);

    if (handle.createSyncAccessHandle) {
      const access = await handle.createSyncAccessHandle();
      access.truncate(0);
      access.write(encoded, { at: 0 });
      access.flush();
      access.close();
      return;
    }

    const writable = await handle.createWritable();
    await writable.write(encoded);
    await writable.close();
  } catch {
    // OPFS is an optimization; IndexedDB remains the authoritative cache.
  }
}
