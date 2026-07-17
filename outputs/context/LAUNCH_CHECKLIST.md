# Commercial Launch Checklist

## Ready

- Static app runs from localhost or any static HTTPS host.
- No external runtime dependencies.
- CSP limits network egress to same-origin Vercel Analytics with `connect-src 'self'`.
- Demo workflow works.
- Folder/file/ZIP ingestion paths exist.
- Worker processing, token estimation, compression, hashing, omitted-file reporting, presets, and cache controls are implemented.
- Local unit tests pass.

## Before Public Sale

- Decide product name/domain/trademark clearance.
- Add customer-facing pricing and license terms outside the app shell.
- Run manual tests on Chrome, Edge, Brave, Safari, and Firefox.
- Run large-repo tests: 1k, 10k, and 50k files with realistic ignore rules.
- Add real WASM tokenizer if exact model-token parity is a paid feature.
- Add Tree-sitter WASM grammars if AST-quality compression is a paid feature.
- Prepare support docs for browser permission prompts.

## Release Artifact

Ship the static `context/` folder or the generated release archive. Do not include `.DS_Store` files.
