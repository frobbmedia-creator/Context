# Security

## Posture

Context is a static client-side app. It should be served from a trusted origin or localhost. It does not require server APIs.

## Controls

- No external CDN assets.
- No telemetry or analytics code.
- Strict CSP in `index.html`.
- Worker-based file processing.
- XML output escapes attributes and wraps content in CDATA-safe sections.
- JSON output uses structured serialization.
- SHA-256 text hashes are included for reproducibility.

## Known Boundaries

- Browser folder access depends on Chromium File System Access APIs.
- Safari and Firefox users should use file/folder upload or ZIP fallback.
- Current tokenizer and compressor are local deterministic estimators, not WASM tiktoken or Tree-sitter.
- File System Access permission prompts must be approved by the user in the browser.

## Launch Recommendation

Serve over HTTPS in production. Keep `connect-src 'none'` unless a future feature explicitly requires network access and has a separate review.
