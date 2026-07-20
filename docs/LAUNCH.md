# Context — Final Launch Checklist (v0.3.0 Icon Status)

## Status: READY FOR ICONIC LAUNCH

- [x] Core CLI (pack / watch / status / mcp / trial)
- [x] Real git prioritization
- [x] Structural compressor + local tokenizer
- [x] XML / JSON export with hashes + omitted audit
- [x] Unit tests
- [x] CHANGELOG + LICENSE + polished README
- [x] Browser free tier remains intact
- [x] **14-day free top-tier Watch trial implemented (local, once-per-machine, cost-controlled)**
- [x] Conversion messaging + urgency banners
- [x] `context trial` command

## Immediate next actions (human / networked machine)

1. Publish:
   ```bash
   npm install
   npm test
   npm publish --access public
   ```
   Verify: `npm view @frobb-media/context version` → 0.3.0

2. Landing page (context.frobbmedia.com):
   - Hero: “14-day free Pro trial of Watch — the daily driver”
   - CTA: `npm install -g @frobb-media/context` then `context watch .`
   - Pricing: Free (pack + browser) → $9/mo Pro after trial
   - Add “CLI LIVE · Free 14-day top-tier trial” badge

3. Soft launch (Day 0–1):
   - Existing free browser users
   - Personal network + early AI coding community
   - Collect watch-session feedback + trial conversion signals

4. Public launch (Day 1–2):
   - Show HN (lead with trial + git-priority + zero upload)
   - r/LocalLLaMA, r/ClaudeAI, r/ChatGPTCoding, r/selfhosted
   - X thread with before/after + trial banner screenshot
   - Product Hunt

## Success metrics (icon status)
- CLI installs / week
- Watch sessions started (trial starts)
- Trial → paid conversion rate
- Weekly Active Watchers (habit)
- Token-saved numbers reported by users
- “How disappointed if this went away” score > 40% very disappointed

## Cost control note
The free top-tier trial is pure local. Zero marginal server cost.
One trial per machine fingerprint. After 14 days the paywall is clean and the free packer remains available forever. This maximizes conversion velocity while protecting LTV.
