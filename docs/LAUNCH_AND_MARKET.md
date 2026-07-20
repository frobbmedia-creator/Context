# Context — Launch & Market Playbook (v0.2)

## Positioning (one sentence)
The only local-first, Git-aware context packer that turns your private workspace into clean, budgeted XML/JSON for Claude, GPT, Gemini or Ollama — without ever uploading a single file.

## Core narrative
- Privacy is the feature, not a checkbox.
- Token cost is the enemy; structural + git prioritization is the weapon.
- Free browser utility = trust. CLI watch mode = daily habit = paid conversion.

## Launch sequence (72-hour plan)

### T-0 (now)
- [x] Accept all technical recommendations
- [x] Ship CLI drop-in (this commit)
- [ ] `npm publish` (or GitHub Packages / binary release)
- [ ] Update context.frobbmedia.com CTAs and pricing copy to match reality

### Day 1 — Soft launch
- Post private link to 20–30 power users who already used the free web tool
- Collect feedback on watch mode latency and token accuracy
- Fix any show-stoppers

### Day 2 — Public
1. Show HN title:  
   “Show HN: Context – local-first Git-aware context packer for LLMs (CLI + browser, zero upload)”
2. Reddit (same day, staggered):
   - r/LocalLLaMA
   - r/ClaudeAI
   - r/MachineLearning (careful)
   - r/vscode / r/Cursor
3. X / Twitter thread:
   - Hook: “I was tired of pasting 80k tokens of noise into Claude”
   - Show `context watch` demo (screen recording)
   - Before/after token counts on a real private repo
   - “Free in the browser. $9/mo for the CLI that lives in your terminal.”
4. Update landing page hero with the watch-mode GIF or short video (assets already exist in original promo/)

### Week 1 content
- “How Context cut my Claude bill 60% on a 12k-file monorepo”
- “Why I stopped using cloud repo-to-prompt tools”
- Short demo videos for TikTok / Shorts / Reels (reuse the existing promo frames)

## Conversion levers
1. Free web → install CLI (one-liner on landing page)
2. First `context watch` session → “this is magic” moment
3. After 3 days of daily use → Pro upgrade prompt
4. Enterprise: air-gapped Docker + secret scanner (ship in v0.3)

## Metrics to watch
- Web → CLI install conversion
- Watch sessions per user
- Token-saved numbers (surface them in the CLI output)
- Stripe MRR from the two existing price points

## Competitive wedges
- vs gitingest / repo2prompt / cloud tools → zero upload, real git status, structured XML with hashes
- vs Cursor / Continue built-in context → works with any model, any editor, fully local, budget control
- vs pure CLI packers → beautiful browser free tier + watch-to-clipboard loop

## Pricing psychology
$9 is an impulse buy for any developer who pays for Claude/GPT.  
Make the value equation: “saves more than $9 in tokens or time in the first week.”

Enterprise at $19/user is cheap enough for small teams and high enough to signal seriousness.

## Final note
Ship the CLI. Everything else is secondary.  
The browser MVP already proved people care about the privacy + packing story.  
The watch mode turns it into a habit. Habits convert.
