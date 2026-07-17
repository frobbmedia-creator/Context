const state = {
  sources: [],
  records: [],
  directoryHandle: null,
  worker: null,
  cached: 0,
  outputMode: "xml"
};

const APP_VERSION = "0.1.0";
const BUILD_ID = "local-launch-mvp";
const SETTINGS_KEY = "context.settings.v1";
const PRESETS_KEY = "context.presets.v1";

const els = {};

document.addEventListener("DOMContentLoaded", () => {
  bindElements();
  if (location.protocol === "file:") {
    showFileProtocolWarning();
    return;
  }
  restoreSettings();
  renderPresetOptions();
  els.versionStatus.textContent = `v${APP_VERSION}`;
  initWorker();
  bindEvents();
  exposeAutomationHooks();
  updateApiStatus();
  updateNetworkStatus();
  registerServiceWorker();
  render();
});

function bindElements() {
  for (const id of [
    "versionStatus", "networkStatus", "apiStatus", "pickDirectory", "loadDemo", "folderInput", "fileInput", "zipInput",
    "refreshWorkspace", "clearWorkspace", "clearCache", "dropZone", "modelSelect", "budgetInput",
    "reservedInput", "compressionSelect", "promptInput", "presetNameInput", "presetSelect", "savePreset",
    "loadPreset", "deletePreset", "fileCount", "includedCount",
    "tokenTotal", "tokenSaved", "budgetRemaining", "cacheStatus", "searchInput", "ignoreInput",
    "applyIgnore", "includeAll", "excludeAll", "autoPack", "progressBar", "fileList",
    "copyXml", "saveXml", "copyJson", "saveJson", "outputPreview"
  ]) {
    els[id] = document.getElementById(id);
  }
}

function showFileProtocolWarning() {
  els.apiStatus.textContent = "Open through localhost";
  els.apiStatus.classList.add("error");
  els.networkStatus.textContent = "File mode";
  document.querySelectorAll("button, input, select, textarea").forEach((control) => {
    if (control.id !== "outputPreview") control.disabled = true;
  });
  els.outputPreview.value = [
    "Context was opened directly as a file.",
    "",
    "Use the local app URL instead:",
    "http://127.0.0.1:4173/",
    "",
    "Direct file mode blocks the browser worker and offline app features, so the interface may appear frozen."
  ].join("\n");
}

function initWorker() {
  try {
    state.worker = new Worker("./worker.js?v=15");
  } catch (error) {
    showStatus(`Worker failed to start: ${error.message}`, true);
    return;
  }
  state.worker.onmessage = (event) => {
    const { type } = event.data;
    if (type === "progress") {
      updateProgress(event.data.complete, event.data.total);
      state.cached = event.data.cached;
      renderSummary();
    } else if (type === "indexed") {
      state.records = event.data.records.map((record) => ({
        ...record,
        included: !record.ignored && !record.binary
      }));
      state.cached = event.data.cached;
      autoPack();
      updateProgress(0, 1);
      render();
    } else if (type === "worker-error") {
      showStatus(`Worker error: ${event.data.error}`, true);
    } else if (type === "cache-cleared") {
      state.cached = 0;
      renderSummary();
      showStatus("Cache cleared.");
    }
  };
}

function bindEvents() {
  els.pickDirectory.addEventListener("click", pickDirectory);
  els.loadDemo.addEventListener("click", loadDemoWorkspace);
  els.folderInput.addEventListener("change", () => ingestFileList(els.folderInput.files));
  els.fileInput.addEventListener("change", () => ingestFileList(els.fileInput.files));
  els.zipInput.addEventListener("change", () => ingestZip(els.zipInput.files[0]));
  els.refreshWorkspace.addEventListener("click", refreshWorkspace);
  els.clearWorkspace.addEventListener("click", clearWorkspace);
  els.clearCache.addEventListener("click", clearCache);
  els.applyIgnore.addEventListener("click", reapplyIgnore);
  els.includeAll.addEventListener("click", () => setAllIncluded(true));
  els.excludeAll.addEventListener("click", () => setAllIncluded(false));
  els.autoPack.addEventListener("click", autoPackAndRender);
  els.copyXml.addEventListener("click", () => copyOutput("xml"));
  els.copyJson.addEventListener("click", () => copyOutput("json"));
  els.saveXml.addEventListener("click", () => saveOutput("xml"));
  els.saveJson.addEventListener("click", () => saveOutput("json"));
  els.savePreset.addEventListener("click", savePreset);
  els.loadPreset.addEventListener("click", loadSelectedPreset);
  els.deletePreset.addEventListener("click", deleteSelectedPreset);
  els.searchInput.addEventListener("input", renderFileList);

  for (const el of [els.modelSelect, els.compressionSelect]) {
    el.addEventListener("change", () => {
      saveSettings();
      if (state.sources.length) indexSources();
    });
  }

  for (const el of [els.budgetInput, els.reservedInput, els.promptInput]) {
    el.addEventListener("input", () => {
      saveSettings();
      render();
    });
  }
  els.ignoreInput.addEventListener("input", saveSettings);

  els.dropZone.addEventListener("dragover", (event) => {
    event.preventDefault();
    els.dropZone.classList.add("dragging");
  });
  els.dropZone.addEventListener("dragleave", () => els.dropZone.classList.remove("dragging"));
  els.dropZone.addEventListener("drop", handleDrop);
  window.addEventListener("online", updateNetworkStatus);
  window.addEventListener("offline", updateNetworkStatus);
}

function currentSettings() {
  return {
    model: els.modelSelect.value,
    compression: els.compressionSelect.value,
    budget: Number(els.budgetInput.value || 0),
    reserved: Number(els.reservedInput.value || 0),
    prompt: els.promptInput.value,
    ignoreRules: els.ignoreInput.value,
    savedAt: new Date().toISOString()
  };
}

function restoreSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return;
    const settings = JSON.parse(raw);
    if (settings.model && optionExists(els.modelSelect, settings.model)) els.modelSelect.value = settings.model;
    if (settings.compression && optionExists(els.compressionSelect, settings.compression)) els.compressionSelect.value = settings.compression;
    if (Number.isFinite(settings.budget)) els.budgetInput.value = String(settings.budget);
    if (Number.isFinite(settings.reserved)) els.reservedInput.value = String(settings.reserved);
    if (typeof settings.prompt === "string") els.promptInput.value = settings.prompt;
    if (typeof settings.ignoreRules === "string") els.ignoreInput.value = settings.ignoreRules;
  } catch {
    localStorage.removeItem(SETTINGS_KEY);
  }
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(currentSettings()));
}

function optionExists(select, value) {
  return Array.from(select.options).some((option) => option.value === value);
}

function readPresets() {
  try {
    const presets = JSON.parse(localStorage.getItem(PRESETS_KEY) || "[]");
    return Array.isArray(presets) ? presets : [];
  } catch {
    localStorage.removeItem(PRESETS_KEY);
    return [];
  }
}

function writePresets(presets) {
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
}

function renderPresetOptions() {
  const presets = readPresets();
  els.presetSelect.replaceChildren();
  const empty = document.createElement("option");
  empty.value = "";
  empty.textContent = presets.length ? "Choose preset" : "No presets saved";
  els.presetSelect.append(empty);
  for (const preset of presets) {
    const option = document.createElement("option");
    option.value = preset.name;
    option.textContent = preset.name;
    els.presetSelect.append(option);
  }
}

function savePreset() {
  const normalized = (els.presetNameInput.value || els.presetSelect.value || "Default").trim();
  if (!normalized) return;
  const presets = readPresets().filter((preset) => preset.name !== normalized);
  presets.push({ name: normalized, settings: currentSettings() });
  presets.sort((a, b) => a.name.localeCompare(b.name));
  writePresets(presets);
  renderPresetOptions();
  els.presetSelect.value = normalized;
  els.presetNameInput.value = normalized;
  showStatus(`Preset saved: ${normalized}`);
}

function loadSelectedPreset() {
  const name = els.presetSelect.value;
  if (!name) return;
  const preset = readPresets().find((item) => item.name === name);
  if (!preset) return;
  applySettings(preset.settings);
  els.presetNameInput.value = name;
  saveSettings();
  if (state.sources.length) indexSources();
  render();
  showStatus(`Preset loaded: ${name}`);
}

function deleteSelectedPreset() {
  const name = els.presetSelect.value;
  if (!name) return;
  writePresets(readPresets().filter((preset) => preset.name !== name));
  renderPresetOptions();
  els.presetNameInput.value = "";
  showStatus(`Preset deleted: ${name}`);
}

function applySettings(settings) {
  if (settings.model && optionExists(els.modelSelect, settings.model)) els.modelSelect.value = settings.model;
  if (settings.compression && optionExists(els.compressionSelect, settings.compression)) els.compressionSelect.value = settings.compression;
  if (Number.isFinite(settings.budget)) els.budgetInput.value = String(settings.budget);
  if (Number.isFinite(settings.reserved)) els.reservedInput.value = String(settings.reserved);
  if (typeof settings.prompt === "string") els.promptInput.value = settings.prompt;
  if (typeof settings.ignoreRules === "string") els.ignoreInput.value = settings.ignoreRules;
}

function exposeAutomationHooks() {
  window.ContextApp = {
    loadSources(sources, message = "Workspace loaded.") {
      state.directoryHandle = null;
      state.sources = sources.map((source) => ({
        ...source,
        ignored: Boolean(source.ignored),
        ignoreReason: source.ignoreReason || ""
      }));
      indexSources();
      showStatus(message);
    },
    snapshot() {
      return {
        files: state.records.length,
        included: state.records.filter((record) => record.included).length,
        tokens: state.records.reduce((sum, record) => record.included ? sum + record.tokens : sum, 0),
        saved: state.records.reduce((sum, record) => record.included ? sum + Math.max(0, (record.fullTokens || 0) - record.tokens) : sum, 0),
        output: els.outputPreview.value
      };
    }
  };
}

function loadDemoWorkspace() {
  state.directoryHandle = null;
  state.sources = [
    {
      path: "README.md",
      name: "README.md",
      size: 1300,
      mtime: 1,
      type: "text/markdown",
      ignored: false,
      text: `# Context

Context is a zero-network, local-first browser utility for turning a workspace into LLM-ready XML or JSON payloads.

The application runs as a static web app with no CDN assets, no telemetry, and a strict Content Security Policy. It supports Chromium folder access, file and folder upload fallback, ZIP import, worker-based indexing, ignore rules, budget-aware packing, XML export, and JSON export.

The core pipeline is:

Acquire -> Walk -> Filter -> Fingerprint -> Classify -> Tokenize -> Rank -> Compress -> Pack -> Export
`
    },
    {
      path: "src/pipeline.ts",
      name: "pipeline.ts",
      size: 2300,
      mtime: 1,
      type: "text/typescript",
      ignored: false,
      text: `export type FileRecord = {
  path: string;
  size: number;
  mtime?: number;
  language: string;
  ignored: boolean;
  binary: boolean;
  tokens: number;
  priority: number;
  content: string;
};

export function availableBudget(total: number, reserved: number): number {
  return Math.max(0, total - reserved);
}

export function autoPack(records: FileRecord[], budget: number): FileRecord[] {
  let used = 0;
  const included = new Set<string>();
  const ranked = [...records].sort((a, b) => b.priority - a.priority || a.tokens - b.tokens);

  for (const record of ranked) {
    if (record.ignored || record.binary) continue;
    if (used + record.tokens <= budget) {
      used += record.tokens;
      included.add(record.path);
    }
  }

  return records.filter((record) => included.has(record.path));
}
`
    },
    {
      path: "src/security.ts",
      name: "security.ts",
      size: 1850,
      mtime: 1,
      type: "text/typescript",
      ignored: false,
      text: `export const contentSecurityPolicy = [
  "default-src 'self'",
  "connect-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'"
].join("; ");

export function escapeXmlAttribute(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&apos;"
  }[char] ?? char));
}

export function safeCdata(value: string): string {
  return value.replaceAll("]]>", "]]]]><![CDATA[>");
}
`
    },
    {
      path: "src/worker-indexer.ts",
      name: "worker-indexer.ts",
      size: 2600,
      mtime: 1,
      type: "text/typescript",
      ignored: false,
      text: `export function estimateTokens(text: string, language: string): number {
  const normalized = text.replace(/\\r\\n/g, "\\n").replace(/\\u0000/g, "");
  if (!normalized.trim()) return 0;
  const parts = normalized.match(/[A-Za-z_$][\\w$-]*|\\d+(?:\\.\\d+)?|\\s+|[^\\sA-Za-z0-9_$]/g) ?? [];
  const codeLike = !/Markdown|Text|YAML|JSON|TOML/.test(language);
  const structural = parts.reduce((sum, part) => sum + tokenWeight(part, codeLike), 0);
  const bytePressure = new TextEncoder().encode(normalized).length / 19;
  return Math.max(1, Math.ceil(Math.max(structural, bytePressure)));
}

export function compactText(text: string): string {
  return text
    .replace(/\\r\\n/g, "\\n")
    .split("\\n")
    .map((line) => line.trimEnd())
    .filter((line, index, lines) => line.trim() || lines[index - 1]?.trim())
    .join("\\n");
}

export function structuralText(text: string): string {
  return compactText(text)
    .split("\\n")
    .filter((line) => /^(import|export|class|interface|type|function|const|let|def|pub)/.test(line.trim()))
    .slice(0, 320)
    .join("\\n");
}
`
    },
    {
      path: "dist/bundle.min.js",
      name: "bundle.min.js",
      size: 980000,
      mtime: 1,
      type: "text/javascript",
      ignored: true,
      ignoreReason: "ignore-rule",
      text: ""
    }
  ];
  indexSources();
  showStatus("Demo workspace loaded.");
}

async function pickDirectory() {
  if (!("showDirectoryPicker" in window)) {
    showStatus("Folder picker is unavailable in this browser. Use Folder Upload or ZIP.", true);
    return;
  }
  try {
    const handle = await window.showDirectoryPicker({ mode: "read", id: "context-workspace" });
    state.directoryHandle = handle;
    await ingestDirectoryHandle(handle);
  } catch (error) {
    if (error.name !== "AbortError") showStatus(error.message, true);
  }
}

async function refreshWorkspace() {
  if (state.directoryHandle) {
    await ingestDirectoryHandle(state.directoryHandle);
  } else if (state.sources.length) {
    indexSources();
  }
}

async function ingestDirectoryHandle(handle) {
  const sources = [];
  const rules = compileIgnoreRules();
  await walkDirectory(handle, "", sources, rules);
  state.sources = sources;
  indexSources();
}

async function walkDirectory(dirHandle, prefix, sources, rules) {
  for await (const [name, handle] of dirHandle.entries()) {
    const path = prefix ? `${prefix}/${name}` : name;
    const ignored = matchesIgnore(path, handle.kind === "directory", rules);
    if (handle.kind === "directory") {
      if (!ignored) await walkDirectory(handle, path, sources, rules);
    } else {
      if (ignored) {
        sources.push({ path, name, size: 0, mtime: 0, type: "", ignored: true, ignoreReason: "ignore-rule", text: "" });
      } else {
        const file = await handle.getFile();
        sources.push(fileToSource(file, path, false));
      }
    }
  }
}

function ingestFileList(fileList) {
  const rules = compileIgnoreRules();
  state.directoryHandle = null;
  state.sources = Array.from(fileList || []).map((file) => {
    const path = file.webkitRelativePath || file.name;
    const ignored = matchesIgnore(path, false, rules);
    return fileToSource(file, path, ignored);
  });
  indexSources();
}

function fileToSource(file, path, ignored) {
  return {
    path,
    name: file.name,
    size: file.size,
    mtime: file.lastModified || 0,
    type: file.type || "",
    ignored,
    ignoreReason: ignored ? "ignore-rule" : "",
    file
  };
}

async function handleDrop(event) {
  event.preventDefault();
  els.dropZone.classList.remove("dragging");
  const items = Array.from(event.dataTransfer.items || []);
  const handleItems = [];
  for (const item of items) {
    if (item.getAsFileSystemHandle) {
      const handle = await item.getAsFileSystemHandle();
      if (handle) handleItems.push(handle);
    }
  }
  if (handleItems.length) {
    const sources = [];
    const rules = compileIgnoreRules();
    for (const handle of handleItems) {
      if (handle.kind === "directory") {
        await walkDirectory(handle, handle.name, sources, rules);
      } else {
        const file = await handle.getFile();
        sources.push(fileToSource(file, file.name, matchesIgnore(file.name, false, rules)));
      }
    }
    state.sources = sources;
    state.directoryHandle = null;
    indexSources();
    return;
  }
  const files = Array.from(event.dataTransfer.files || []);
  const zip = files.find((file) => file.name.toLowerCase().endsWith(".zip"));
  if (zip) await ingestZip(zip);
  else ingestFileList(files);
}

async function ingestZip(file) {
  if (!file) return;
  try {
    const entries = await parseZip(file);
    const rules = compileIgnoreRules();
    state.directoryHandle = null;
    state.sources = entries.map((entry) => ({
      path: entry.path,
      name: entry.path.split("/").pop() || entry.path,
      size: entry.text.length,
      mtime: entry.mtime || 0,
      type: "text/plain",
      ignored: matchesIgnore(entry.path, false, rules),
      ignoreReason: "",
      text: entry.text
    }));
    indexSources();
  } catch (error) {
    showStatus(`ZIP import failed: ${error.message}`, true);
  }
}

async function parseZip(file) {
  const buffer = await file.arrayBuffer();
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  const entries = [];
  let offset = 0;
  const decoder = new TextDecoder();

  while (offset + 30 < bytes.length) {
    if (view.getUint32(offset, true) !== 0x04034b50) break;
    const method = view.getUint16(offset + 8, true);
    const compressedSize = view.getUint32(offset + 18, true);
    const uncompressedSize = view.getUint32(offset + 22, true);
    const nameLength = view.getUint16(offset + 26, true);
    const extraLength = view.getUint16(offset + 28, true);
    const nameStart = offset + 30;
    const name = decoder.decode(bytes.slice(nameStart, nameStart + nameLength));
    const dataStart = nameStart + nameLength + extraLength;
    const dataEnd = dataStart + compressedSize;

    if (!name.endsWith("/")) {
      if (uncompressedSize > 2_000_000) {
        entries.push({ path: name, text: `[Skipped large ZIP entry: ${uncompressedSize} bytes]` });
      } else {
        const compressed = bytes.slice(dataStart, dataEnd);
        const data = method === 0 ? compressed : await inflateZipEntry(compressed, method);
        entries.push({ path: name, text: decoder.decode(data) });
      }
    }
    offset = dataEnd;
  }

  if (!entries.length) throw new Error("No readable stored entries found.");
  return entries;
}

async function inflateZipEntry(bytes, method) {
  if (method !== 8) throw new Error(`Unsupported ZIP compression method ${method}.`);
  if (!("DecompressionStream" in window)) {
    throw new Error("Compressed ZIP entries need a browser with DecompressionStream support.");
  }
  const formats = ["deflate-raw", "deflate"];
  for (const format of formats) {
    try {
      const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream(format));
      return new Uint8Array(await new Response(stream).arrayBuffer());
    } catch {
      // Try the next browser-supported deflate wrapper.
    }
  }
  throw new Error("Unable to decompress ZIP entry locally.");
}

function indexSources() {
  state.records = [];
  state.cached = 0;
  updateProgress(0, Math.max(state.sources.length, 1));
  state.worker.postMessage({
    type: "index-files",
    payload: {
      files: state.sources,
      model: els.modelSelect.value,
      compression: els.compressionSelect.value,
      rootHandle: state.directoryHandle
    }
  });
  renderSummary();
}

function reapplyIgnore() {
  const rules = compileIgnoreRules();
  state.sources = state.sources.map((source) => {
    const ignored = matchesIgnore(source.path, false, rules);
    return { ...source, ignored, ignoreReason: ignored ? "ignore-rule" : "" };
  });
  indexSources();
}

function compileIgnoreRules() {
  return els.ignoreInput.value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith("#"));
}

function matchesIgnore(path, isDirectory, rules) {
  const normalized = path.replace(/\\/g, "/");
  return rules.some((rule) => {
    if (rule.endsWith("/")) {
      const dir = rule.slice(0, -1);
      return isDirectory ? normalized === dir || normalized.endsWith(`/${dir}`) : normalized.includes(`${dir}/`);
    }
    if (rule.startsWith("*.")) return normalized.toLowerCase().endsWith(rule.slice(1).toLowerCase());
    return normalized === rule || normalized.includes(`/${rule}`) || normalized.includes(rule);
  });
}

function setAllIncluded(included) {
  state.records = state.records.map((record) => ({
    ...record,
    included: included && !record.binary && !record.ignored
  }));
  render();
}

function autoPackAndRender() {
  autoPack();
  render();
}

function autoPack() {
  const available = availableBudget();
  let used = 0;
  const sorted = [...state.records].sort((a, b) => b.priority - a.priority || a.tokens - b.tokens);
  const includePaths = new Set();
  for (const record of sorted) {
    if (record.binary || record.ignored) continue;
    if (used + record.tokens <= available) {
      used += record.tokens;
      includePaths.add(record.path);
    }
  }
  state.records = state.records.map((record) => ({ ...record, included: includePaths.has(record.path) }));
}

function availableBudget() {
  return Math.max(0, Number(els.budgetInput.value || 0) - Number(els.reservedInput.value || 0));
}

function render() {
  renderSummary();
  renderFileList();
  renderPreview();
}

function renderSummary() {
  const included = state.records.filter((record) => record.included);
  const tokens = included.reduce((sum, record) => sum + record.tokens, 0);
  const saved = included.reduce((sum, record) => sum + Math.max(0, (record.fullTokens || 0) - record.tokens), 0);
  els.fileCount.textContent = String(state.records.length || state.sources.length);
  els.includedCount.textContent = String(included.length);
  els.tokenTotal.textContent = formatNumber(tokens);
  els.tokenSaved.textContent = formatNumber(saved);
  els.budgetRemaining.textContent = formatNumber(availableBudget() - tokens);
  els.cacheStatus.textContent = String(state.cached);
}

function renderFileList() {
  const query = els.searchInput.value.trim().toLowerCase();
  const records = state.records.filter((record) =>
    !query || record.path.toLowerCase().includes(query) || record.language.toLowerCase().includes(query)
  );
  els.fileList.replaceChildren(...records.map(fileRow));
}

function fileRow(record) {
  const row = document.createElement("div");
  row.className = `file-row ${record.ignored ? "ignored" : ""} ${record.priority >= 80 ? "git-active" : ""}`;
  row.setAttribute("role", "listitem");

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = Boolean(record.included);
  checkbox.disabled = record.binary || record.ignored;
  checkbox.addEventListener("change", () => {
    record.included = checkbox.checked;
    renderSummary();
    renderPreview();
  });

  const path = document.createElement("div");
  path.className = "file-path";
  path.innerHTML = `<strong></strong><span></span>`;
  path.querySelector("strong").textContent = record.path;
  path.querySelector("span").textContent = [record.language, record.ignored ? record.ignoreReason : "", record.binary ? "binary" : ""].filter(Boolean).join(" · ");
  if (record.priority >= 80) {
    const badge = document.createElement("span");
    badge.className = "git-badge";
    badge.textContent = "modified";
    path.querySelector("strong").appendChild(badge);
  }

  const saved = Math.max(0, (record.fullTokens || 0) - record.tokens);
  const tokens = meta(saved ? `${formatNumber(record.tokens)} tok (-${formatNumber(saved)})` : `${formatNumber(record.tokens)} tok`);
  const size = meta(formatBytes(record.size));

  const priority = document.createElement("input");
  priority.className = "priority";
  priority.type = "range";
  priority.min = "1";
  priority.max = "100";
  priority.value = String(record.priority);
  priority.title = "Priority";
  priority.addEventListener("input", () => {
    record.priority = Number(priority.value);
  });

  row.append(checkbox, path, tokens, size, priority);
  return row;
}

function meta(text) {
  const el = document.createElement("div");
  el.className = "file-meta";
  el.textContent = text;
  return el;
}

function renderPreview(mode = state.outputMode) {
  state.outputMode = mode;
  els.outputPreview.value = mode === "json" ? buildJson() : buildXml();
}

function buildXml() {
  const included = state.records.filter((record) => record.included);
  const omitted = omittedRecords();
  const prompt = els.promptInput.value.trim() || "[Prompt]";
  const body = included.map((record) => {
    const content = safeCdata(sanitizeXmlString(record.content || ""));
    const warnings = record.warnings?.length ? ` warnings="${escapeAttr(record.warnings.join(","))}"` : "";
    const hash = record.contentHash ? ` sha256="${escapeAttr(record.contentHash)}" hash_scope="${escapeAttr(record.hashScope)}"` : "";
    return `  <file path="${escapeAttr(record.path)}" language="${escapeAttr(record.language)}" tokens="${record.tokens}" tokenizer="${escapeAttr(record.tokenizer || "Context local tokenizer")}" compressor="${escapeAttr(record.compressor || "Context compressor")}" compression="${escapeAttr(record.compression)}"${hash}${warnings}>\n<![CDATA[\n${content}\n]]>\n  </file>`;
  }).join("\n");
  const omittedBody = omitted.length
    ? `\n  <omitted_files count="${omitted.length}">\n${omitted.map((record) => `    <omitted path="${escapeAttr(record.path)}" reason="${escapeAttr(omitReason(record))}" tokens="${record.tokens || 0}" size="${record.size || 0}"${record.contentHash ? ` sha256="${escapeAttr(record.contentHash)}" hash_scope="${escapeAttr(record.hashScope)}"` : ""} />`).join("\n")}\n  </omitted_files>`
    : "";

  return `You are an expert developer. Below is the system context.\n\n<context_bundle app="Context" version="${APP_VERSION}" build="${BUILD_ID}" files="${included.length}" omitted="${omitted.length}" tokens="${included.reduce((sum, record) => sum + record.tokens, 0)}">\n${body}${omittedBody}\n</context_bundle>\n\nUsing the context above, solve the following issue: ${prompt}\n`;
}

function buildJson() {
  const included = state.records.filter((record) => record.included);
  const omitted = omittedRecords();
  const used = included.reduce((sum, record) => sum + record.tokens, 0);
  const saved = included.reduce((sum, record) => sum + Math.max(0, (record.fullTokens || 0) - record.tokens), 0);
  return JSON.stringify({
    schema: "context.bundle.v1",
    app: {
      name: "Context",
      version: APP_VERSION,
      build: BUILD_ID
    },
    generatedAt: new Date().toISOString(),
    model: els.modelSelect.value,
    tokenizer: included[0]?.tokenizer || "Context local tokenizer",
    tokenizerVersion: included[0]?.tokenizerVersion || "unknown",
    compressor: included[0]?.compressor || "Context compressor",
    compressorVersion: included[0]?.compressorVersion || "unknown",
    budget: {
      total: Number(els.budgetInput.value || 0),
      reserved: Number(els.reservedInput.value || 0),
      available: availableBudget(),
      used,
      remaining: availableBudget() - used,
      saved
    },
    prompt: els.promptInput.value,
    files: included.map((record) => ({
      path: record.path,
      language: record.language,
      size: record.size,
      contentHash: record.contentHash,
      hashAlgorithm: record.hashAlgorithm,
      hashScope: record.hashScope,
      tokens: record.tokens,
      fullTokens: record.fullTokens,
      tokenizer: record.tokenizer,
      tokenizerVersion: record.tokenizerVersion,
      compressor: record.compressor,
      compressorVersion: record.compressorVersion,
      compression: record.compression,
      priority: record.priority,
      warnings: record.warnings || [],
      content: record.content || ""
    })),
    omitted: omitted.map((record) => ({
      path: record.path,
      reason: omitReason(record),
      language: record.language,
      size: record.size,
      contentHash: record.contentHash,
      hashAlgorithm: record.hashAlgorithm,
      hashScope: record.hashScope,
      tokens: record.tokens || 0,
      priority: record.priority,
      ignored: Boolean(record.ignored),
      binary: Boolean(record.binary),
      warnings: record.warnings || []
    }))
  }, null, 2);
}

function omittedRecords() {
  return state.records.filter((record) => !record.included);
}

function omitReason(record) {
  if (record.ignored) return record.ignoreReason || "ignore-rule";
  if (record.binary) return "binary-file";
  if ((record.tokens || 0) > availableBudget()) return "exceeds-budget";
  return "not-selected-or-over-budget";
}

function safeCdata(text) {
  return text.replaceAll("]]>", "]]]]><![CDATA[>");
}

function sanitizeXmlString(text) {
  if (!text) return "";
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}

function escapeAttr(text) {
  return String(text).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&apos;"
  })[char]);
}

async function copyOutput(mode) {
  renderPreview(mode);
  await navigator.clipboard.writeText(els.outputPreview.value);
  showStatus(`${mode.toUpperCase()} copied.`);
}

async function saveOutput(mode) {
  renderPreview(mode);
  const ext = mode === "json" ? "json" : "md";
  const blob = new Blob([els.outputPreview.value], { type: mode === "json" ? "application/json" : "text/markdown" });
  if ("showSaveFilePicker" in window) {
    const handle = await window.showSaveFilePicker({
      suggestedName: `context-bundle.${ext}`,
      types: [{ description: "Context bundle", accept: { [blob.type]: [`.${ext}`] } }]
    });
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
  } else {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `context-bundle.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

function clearWorkspace() {
  state.sources = [];
  state.records = [];
  state.directoryHandle = null;
  state.cached = 0;
  render();
}

function clearCache() {
  state.cached = 0;
  state.worker.postMessage({ type: "clear-cache" });
  renderSummary();
}

function updateProgress(complete, total) {
  els.progressBar.firstElementChild.style.width = `${Math.round((complete / total) * 100)}%`;
}

function showStatus(message, isError = false) {
  els.apiStatus.textContent = message;
  els.apiStatus.classList.toggle("error", isError);
}

function updateApiStatus() {
  const hasFsa = "showDirectoryPicker" in window;
  const hasOpfs = navigator.storage && "getDirectory" in navigator.storage;
  els.apiStatus.textContent = `${hasFsa ? "Folder API" : "Fallback"} · ${hasOpfs ? "OPFS available" : "IndexedDB cache"}`;
}

function updateNetworkStatus() {
  els.networkStatus.textContent = navigator.onLine ? "Network blocked by CSP" : "Offline";
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
}

function formatNumber(value) {
  return new Intl.NumberFormat().format(Math.round(value));
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const order = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** order).toFixed(order ? 1 : 0)} ${units[order]}`;
}
