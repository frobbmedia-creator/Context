# Context

Static landing + product shell for **context.frobbmedia.com**.

## Layout (do not flatten)

```
outputs/context/   ← production static assets (index.html, app.js, Stripe CTAs)
vercel.json        ← URL rewrites so `/` serves outputs/context (no Node build)
```

## Vercel (zero-framework)

- **Do not** add a root `package.json` (triggers npm/container builds).
- Deploy branch: `main` with `outputs/context/**` present.
- `vercel.json` rewrites `/*` → `/outputs/context/*` so the public site root is correct while the monorepo path stays nested.

### Optional dashboard alternative

Project Settings → General → **Root Directory** = `outputs/context`, Framework = **Other**, clear Build/Install.  
If you use Root Directory, remove the `rewrites` block from `vercel.json` (or delete it) so paths are not double-prefixed.

## Local

Open `outputs/context/index.html` or any static server pointed at that folder.
