# Context — Final Launch Checklist

## Status: Ready to ship

- [x] Core CLI (pack / watch / status / mcp)
- [x] Real git prioritization
- [x] ESM fix verified in production use
- [x] Structural compressor + local tokenizer
- [x] XML / JSON export with hashes + omitted audit
- [x] Unit tests (tokenizer, compressor, export)
- [x] CHANGELOG + LICENSE + polished README
- [x] Browser free tier remains intact

## Immediate next actions (human)

1. On a networked machine:
   ```bash
   git pull origin main
   npm install
   npm test
   npm publish --access public   # or private registry
   ```

2. Update landing page (context.frobbmedia.com):
   - Change Pro CTA to real install command
   - Add “CLI is live” badge
   - Link to this README / GitHub releases

3. Soft launch:
   - Share watch-mode demo with existing free users
   - Collect 24h feedback

4. Public launch:
   - Show HN
   - r/LocalLLaMA + r/ClaudeAI
   - X thread with before/after token numbers

## Success metrics
- CLI installs / week
- Watch sessions (habit formation)
- Conversion free → Pro
- Token-saved numbers reported by users
