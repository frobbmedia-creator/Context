# Context

**Local-first, git-aware context packs for LLMs.**

Turn any private workspace into clean, budgeted XML or JSON for Claude, GPT, Gemini, or Ollama — without uploading a single file.

```bash
npm install -g @frobb-media/context
context watch .
```

First `context watch` starts a **14-day free full Pro trial**. One-shot `context pack` is free forever.

---

### Why this exists

Most context tools either:
- dump the entire repo (noisy, expensive), or
- require uploading your code.

Context does neither. It uses real `git status` to prioritize the files you actually changed, applies structural compression (signatures stay, bodies go), and respects a hard token budget. Everything stays on your machine.

### Quick start

```bash
# Always free — one-shot pack
context pack . --out clipboard

# Daily driver (14-day free trial starts automatically)
context watch .

# See what would be prioritized
context status .

# Trial / license status
context trial

# Shareable invite
context invite
```

### What you get

| Feature | Free | Pro (after trial) |
|---------|------|-------------------|
| `context pack` | ✓ | ✓ |
| Browser utility | ✓ | ✓ |
| Git prioritization | ✓ | ✓ |
| Structural compression | ✓ | ✓ |
| Context Score | ✓ | ✓ |
| `context watch` (live re-pack → clipboard) | 14-day trial | ✓ |
| Priority support | — | ✓ |

### How packing works

```
Acquire (fast-glob + .gitignore)
  → Real git status → priority 100 for any change
  → Filter binaries & oversized files
  → Structural compression (language-aware skeletons)
  → Local token estimate
  → Greedy budget pack (high priority first)
  → Clean XML (CDATA + SHA-256) or JSON
```

No telemetry of file contents. Trial state is a local timestamp only.

### Browser

Air-gapped web utility (still free): [context.frobbmedia.com](https://context.frobbmedia.com)

### Pricing

- **Core** — free forever (pack + browser)
- **Pro** — $9/mo after the 14-day trial (Watch + priority)
- **Enterprise** — $19/user/mo (air-gapped Docker, seats, scanner)

### Development

```bash
git clone https://github.com/frobbmedia-creator/Context.git
cd Context
npm install
npm test
npx context pack . --out /tmp/test.xml
```

MIT · [Changelog](./CHANGELOG.md)
