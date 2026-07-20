# One-Command Path to Icon Status (Mac)

```bash
# 1. Get latest
git clone https://github.com/frobbmedia-creator/Context.git || (cd Context && git pull)
cd Context

# 2. Publish
npm install && npm test && npm publish --access public

# 3. Verify
npm view @frobb-media/context version   # expect 0.3.0

# 4. Soft test the trial yourself
npx @frobb-media/context watch .
# → should print the big free top-tier trial banner

# 5. Fire launches (copy from docs/LAUNCH_POSTS.md)
# - Show HN
# - r/LocalLLaMA + r/ClaudeAI
# - X thread
# - Product Hunt
```

Landing is already live with trial messaging (Vercel serves outputs/context).

You are 5 minutes from public icon status.
