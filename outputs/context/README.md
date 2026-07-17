# Context

Context is a local-first browser utility for packaging workspace files into LLM-ready XML or JSON. It is designed to run without workspace uploads or CDN dependencies, with first-party Vercel Web Analytics enabled for page traffic.

## Run

Serve this folder locally:

```sh
python3 -m http.server 4173
```

Open:

```text
http://127.0.0.1:4173/index.html?v=15
```

Do not open `index.html` directly with `file://`; workers and browser storage APIs need localhost.

## Current Capabilities

- Chromium folder ingestion with File System Access API.
- File, folder-upload, drag/drop, and ZIP fallback ingestion.
- Worker-based indexing, token counting, hashing, compression, and packing.
- Local tokenizer estimator with model profiles.
- Structural compressor for deterministic code compaction.
- SHA-256 text hashes in XML and JSON exports.
- Omitted-file audit reports.
- Local settings and preset persistence.
- IndexedDB cache plus OPFS snapshot optimization.
- Strict CSP with `connect-src 'self'` for same-origin Vercel Analytics.
- Clear cache control.

## Test

```sh
node tests/unit-tests.mjs
```

## Launch Docs

- `PRIVACY.md`
- `SECURITY.md`
- `LAUNCH_CHECKLIST.md`
- `LICENSE.md`
- `TERMS_TEMPLATE.md`
- `RELEASE_NOTES.md`
