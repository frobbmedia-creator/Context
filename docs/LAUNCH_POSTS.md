# Launch Posts — Ready to Fire (v0.3.0 Icon)

## Show HN

**Title:**
Show HN: Context – local git-aware context packs for LLMs with 14-day free Watch trial (zero upload)

**Body:**
I got tired of pasting 60-80k tokens of noise into Claude/Cursor every day and of tools that want to upload my private repos.

So I built Context:

- Real `git status --porcelain` prioritization (changed files first)
- Structural compression (keep signatures, elide bodies)
- Local token budgeting matched to Claude/GPT
- One-shot `context pack` → free forever
- `context watch` (re-pack on every save → clipboard) → full Pro features free for 14 days, then $9/mo
- Pure local. Nothing leaves your machine. Ever.

Install and try the daily driver in 10 seconds:

```
npm install -g @frobb-media/context
context watch .
```

First `watch` starts the 14-day free top-tier trial automatically (local only).

Browser version (also free, air-gapped): https://context.frobbmedia.com

Would love feedback from people who live in Claude/Cursor/Aider/Ollama daily.

---

## Reddit (r/LocalLLaMA, r/ClaudeAI, r/ChatGPTCoding, r/selfhosted)

**Title:**
Context – local-first git-aware context packer with free 14-day Watch trial (no upload)

**Body:**
Built a small but sharp tool for anyone who feeds codebases to LLMs:

- Prioritizes files that actually changed (`git status`)
- Structural compression so you stay under budget without losing the important bits
- `context watch` keeps a live, high-signal pack on your clipboard every time you save
- Everything local. Zero upload.

One-shot pack is free forever. Watch mode (the daily driver) is full Pro for 14 days free, then $9.

```
npm i -g @frobb-media/context
context watch .
```

Site + browser utility: https://context.frobbmedia.com

Happy to answer any questions about the packing strategy or the trial design.

---

## X / Twitter Thread

1/ I was done pasting 70k tokens of mostly noise into Claude every morning.

Also done with tools that want to upload my private repos.

So I shipped Context.

2/ What it does:
• Real git prioritization (your actual changes first)
• Structural compression (signatures stay, bodies go)
• Local token budget
• `context watch` → live pack on clipboard on every save

3/ Zero upload. Ever.
Browser version is fully air-gapped.
CLI never phones home with your code.

4/ Pricing that doesn’t suck:
• One-shot pack → free forever
• Full Watch (the habit) → 14-day free top-tier trial, then $9/mo

First `context watch` starts the trial automatically. Local only.

5/ Try it:
```
npm install -g @frobb-media/context
context watch .
```

Site: https://context.frobbmedia.com

If you live in Claude / Cursor / Ollama, this should feel like the missing local layer.

---

## Product Hunt (when ready)

Tagline: Local-first git-aware context packs for any LLM. 14-day free Watch trial.

Description: Context turns any private workspace into clean, budgeted, high-signal XML/JSON for Claude, GPT, Gemini or Ollama — without ever uploading a file. Real git prioritization + structural compression. Free one-shot packer. Full daily-driver Watch mode free for 14 days.
