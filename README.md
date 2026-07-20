# Context v0.2.1

**Local-first · Git-aware · LLM-ready context packs**

The killer utility for turning any private workspace into clean, budgeted XML or JSON for Claude, GPT, Gemini, or Ollama — without ever uploading a single file.

## Install

```bash
npm install -g @frobb-media/context
# or
npx @frobb-media/context
```

## Commands

```bash
# One-shot pack (clipboard)
context pack . --budget 120000 --model claude --out clipboard

# Daily driver — re-packs on every save
context watch . --budget 120000 --model claude --out clipboard

# Inspect priorities
context status .

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
| Core Web | Free | Full browser utility |
| Pro | $9/mo | CLI + watch mode + clipboard sync |
| Enterprise | $19/user/mo | Air-gapped Docker, secret scanner, seats |

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
