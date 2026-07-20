# Changelog

## [0.3.2] — 2026-07-20

### Hotfix: single source of truth for APP_VERSION
- `src/export.js` was hardcoding `APP_VERSION = '0.2.0'` while npm and CLI shipped as 0.3.1 — every generated bundle header said `version="0.2.0"`, an easy credibility hit for a sharp critic pasting a bundle into the launch thread.
- New `src/version.js` reads the version from `package.json` at module load. `bin/context.js` and `cli/bin/context.js` also import it for `--version` parity.
- BUILD_ID bumped to `cli-killer-v3` so bundles from this release are distinguishable.
- Bundle header now correctly reads `version="0.3.2" build="cli-killer-v3"`.
- `.gitignore` updated to exclude `node_modules/` and `package-lock.json` (prior commits had them staged).

## [0.3.1] — 2026-07-20

### First-impression polish (for harsh developer critics)
- Cleaner, professional trial messaging
- Tighter CLI help and command descriptions
- Clean success lines: `files · tokens · saved · Score XX/100`
- Sharper structural compressor (JS/TS/React/Python)
- Hardened MCP server (PACK / STATUS / SCORE)
- README rewritten for scannability and credibility

## [0.3.0] — 2026-07-20

### Icon foundations
- 14-day free top-tier Pro trial for `context watch`
- Context Score (token savings + priority hit rate)
- `context invite`
- Watch as hero path
- Landing + launch posts ready

## [0.2.x]
- Core CLI, git prioritization, structural compressor, browser utility
