# Context v0.3.0

**Local-first · Git-aware · LLM-ready context packs**

The killer utility for turning any private workspace into clean, budgeted XML or JSON for Claude, GPT, Gemini, or Ollama — without ever uploading a single file.

**Icon status unlocked:** Free forever one-shot packer + **14-day free top-tier trial** of the full Pro daily-driver (`context watch`).

## Install

```bash
npm install -g @frobb-media/context
# or
npx @frobb-media/context
```

## Commands

```bash
# One-shot pack (always free)
context pack . --budget 120000 --model claude --out clipboard

# Daily driver — full Pro features (14-day free top-tier trial starts automatically)
context watch . --budget 120000 --model claude --out clipboard

# Inspect priorities + trial status
context status .

# Explicit trial / license status
context trial

# Experimental agent integration
context mcp --workspace .
```

### Key flags

| Flag | Description | Default |
|------|-------------|---------| 
| `-b, --budget` | Total token budget | 128000 |
| `-r, --reserved` | Tokens reserved for your prompt | 4000 |
| `-m, --model` | `claude` \| `gpt-5` \| `generic` \| `tiktoken` | claude |
| `-c, --compression` | `structural` \| `compact` \| `full` \| `summary` | structural |
| `-f, --format` | `xml` \| `json` | xml |
| `-o, --out` | `stdout` \| `clipboard` \| `<file>` | stdout |
| `-p, --prompt` | Task description appended to the bundle | — |
| `--no-git` | Disable git prioritization | — |

## Free Top-Tier Trial (Watch)

- First time you run `context watch`, a **14-day free Pro trial** starts automatically.
- Full Watch mode + all current Pro features unlocked.
- Local only (`~/.config/context/`). No credit card. No upload. No telemetry of your code.
- One trial per machine (lightweight fingerprint).
- After 14 days: `context pack` stays free forever. `context watch` requires Pro.
- Check remaining days anytime: `context trial` or `context status`.

This is deliberately generous so you feel the daily-driver habit before any paywall. Designed for conversion, not unlimited free usage. Zero infrastructure cost.

## How it works

```
Acquire (fast-glob + .gitignore)
  → Real git status (porcelain) → priority 100 for any change
  → Filter binaries & oversized files
  → Structural compression (keep signatures, elide bodies)
  → Local token estimate
  → Greedy budget pack (high priority first)
  → Export clean XML (CDATA + SHA-256) or JSON
```

Everything stays on your machine. No telemetry of file contents.

## Browser version

The original air-gapped browser utility is still available at  
https://context.frobbmedia.com (static, zero upload, free forever).

## Monetization

| Tier | Price | Includes |
|------|-------|----------|
| Core Web + Pack | Free | Full browser utility + one-shot CLI pack |
| Pro (after 14-day free trial) | $9/mo | Full Watch mode, advanced compression, priority support |
| Enterprise | $19/user/mo | Air-gapped Docker, secret scanner, seats |

Upgrade: https://context.frobbmedia.com/pro

## Development

```bash
git clone https://github.com/frobbmedia-creator/Context.git
cd Context
npm install
npm test
npx context pack . --out /tmp/test.xml
```

## License

MIT
