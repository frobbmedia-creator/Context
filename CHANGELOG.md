# Changelog

## [0.3.0] — 2026-07-20

### Added — Icon Status Release
- **Free 14-day top-tier Pro trial** for `context watch` (full daily-driver features).
  - Starts automatically on first watch.
  - Local-only (`~/.config/context/trial.json`), once per machine.
  - Zero server cost, zero code telemetry.
  - Clear banners + urgency messaging. Designed for conversion, not unlimited free.
- New command: `context trial` (status of trial / license).
- `context status` now also surfaces trial state.
- Hard gate after trial expiry: pack remains free forever; watch requires Pro.
- Version and messaging polished for iconic daily-driver positioning.

### Why this design
- Generous first experience so users feel the must-have habit (Sean Ellis).
- Finite window creates natural urgency without being aggressive.
- Local implementation = no infrastructure cost to "watch".
- Conversion path is explicit and one-click from the CLI banners.

## [0.2.1] — 2026-07-20

### Fixed
- ESM crash: `ignore` is a CJS package. Named import `{ createIgnore }` failed under `"type": "module"`.
  Switched to default import `import ignore from 'ignore'` + `ignore()`.
- Bin executable bit set correctly.

### Verified
- One-shot pack works (real user run: 37 files · 5600 tokens · 21k saved).
- Clipboard output functional.

## [0.2.0] — 2026-07-20

### Added
- Full CLI: `context pack`, `context watch`, `context status`, `context mcp`
- Real git prioritization via `git status --porcelain` + `git ls-files`
- Structural compressor + local tokenizer
- Watch mode with debounce → clipboard / file
- Experimental MCP stdio server
- SHA-256 hashes + omitted-file audit in exports
- npm-ready package structure

### Browser
- Original local-first web utility remains free and unchanged in `outputs/context/`

## [0.1.0] — Initial MVP
- Browser-only File System Access API packer
- Worker-based indexing, ignore rules, token estimation, structural compression
