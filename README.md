# Context v0.2 — Killer Utility

**Local-first · Git-aware · LLM-ready context packs**

Browser utility (free, air-gapped) + CLI daemon with real git status and watch-to-clipboard.

## What’s new in v0.2

| Area | Before (v0.1) | After (v0.2) |
|------|---------------|--------------|
| Git awareness | Binary `.git/index` + mtime | Real `git status --porcelain` + `git ls-files` |
| CLI | Vapor | Full `context pack` + `context watch` + `context status` |
| Watch mode | Missing | Auto re-pack → clipboard/file on every save |
| MCP | Missing | Experimental stdio server for agents |
| Packaging | Static web only | npm-ready CLI + original static web |

## Quick start (CLI — the product)

```bash
npm install

# One-shot pack
npx context pack . --budget 120000 --model claude --out clipboard

# Daily driver (the conversion feature)
npx context watch . --budget 120000 --model claude --out clipboard

# Inspect priorities
npx context status .

# Agent integration
npx context mcp --workspace .
```

### Useful flags

```
context pack [dir]
  -b, --budget <tokens>       Total context budget (default 128000)
  -r, --reserved <tokens>     Leave room for your prompt (default 4000)
  -m, --model <name>          claude | gpt-5 | generic | tiktoken
  -c, --compression <mode>    structural | compact | full | summary
  -f, --format <fmt>          xml | json
  -o, --out <target>          stdout | clipboard | ./bundle.xml
  -p, --prompt "Fix the auth bug"
  --no-git                    Disable git prioritization
```

## Web utility (still free forever)

The original browser app lives in `outputs/context/`.
Deploy with Vercel (zero-framework, root rewrite already set).

## Architecture

```
Acquire (fast-glob + gitignore)
  → Real git priority (porcelain status)
  → Filter binaries & large files
  → Compress (structural / compact / …)
  → Token estimate
  → Greedy budget pack (priority desc)
  → Export (XML + SHA-256 + omitted audit or JSON)
```

Everything stays local. No file contents ever leave the machine.

## Monetization

| Tier | Price | What you get |
|------|-------|--------------|
| Core Web | $0 | Full browser utility |
| Pro | $9 / mo | CLI + watch + clipboard + local pipelines |
| Enterprise | $19 / user / mo | Air-gapped Docker, secret scanner, seats, SLA |

The CLI + watch loop is the conversion engine.

## Launch & Market

See `docs/LAUNCH_AND_MARKET.md` for the full 72-hour playbook, positioning, distribution channels, and metrics.

## Security

- CLI never phones home.
- Web: strict CSP, `connect-src 'self'`, no upload endpoints.
- SHA-256 on every included file.
- Omitted-file audit so the model knows what was left out.

## License

MIT — see LICENSE.md

---

**This is the version that ships.**  
Browser MVP proved the idea. CLI + real git + watch mode makes it a killer utility.
