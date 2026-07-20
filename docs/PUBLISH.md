# Publish Checklist — Final

Run these commands **on your local machine** (the sandbox has no internet and cannot publish).

```bash
cd /Users/frobbclaw/Documents/Codex/2026-07-17/u/Context

# 1. Make sure you have the latest remote changes
git pull origin main

# 2. Check status — commit anything still local if needed
git status

# 3. If you still have uncommitted local fixes (ESM, mode bits, etc.):
#    git add src/cli-core.js cli/bin/context.js package-lock.json
#    git commit -m "chore: local polish before publish"
#    git push origin main

# 4. Install & test
npm install
npm test

# 5. Publish
npm publish --access public

# 6. Verify
npm view @frobbmedia/context version
# → should print 0.2.1
```

After a successful publish the landing page CTA becomes fully live:

```
npm install -g @frobbmedia/context
```
