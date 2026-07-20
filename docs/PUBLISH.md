# Publish Checklist (Step 1)

Run these commands on a machine with network access (your local machine is already set up):

```bash
cd /Users/frobbclaw/Documents/Codex/2026-07-17/u/Context   # or wherever the repo lives

git pull origin main
npm install
npm test                    # should show 8 passing
npm publish --access public
```

After publish succeeds:

```bash
npm view @frobbmedia/context version
# should print 0.2.1
```

Then the landing page CTA (`npm install -g @frobbmedia/context`) becomes live for everyone.
