# Publish Checklist — v0.3.0 Icon Status

Run on your Mac (networked machine). The Grok terminal / sandbox has no internet and cannot publish.

```bash
cd /path/to/Context   # or git clone https://github.com/frobbmedia-creator/Context.git

git pull origin main

npm install
npm test

# Confirm version
node -e "console.log(require('./package.json').version)"   # should be 0.3.0

# Publish (use the scoped name that matches package.json)
npm publish --access public

# Verify
npm view @frobb-media/context version
# → 0.3.0
```

After publish:
1. Landing page is already updated (trial messaging live via Vercel rewrite to outputs/context).
2. Soft launch to existing users.
3. Fire the posts in docs/LAUNCH_POSTS.md (Show HN first).

Trial is local-only → zero cost to run. Convert aggressively after the 14-day window.
