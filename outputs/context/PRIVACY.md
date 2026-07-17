# Privacy Policy

Context is a local-first browser utility. Workspace files are processed in the browser and are not uploaded by the application.

## Data Processed

- User-selected files and folders.
- File metadata such as path, size, token count, compression mode, and SHA-256 text hashes.
- User-entered prompts, ignore rules, settings, and presets.

## Local Storage

Context stores data locally in the browser:

- Local storage for settings and presets.
- IndexedDB for file analysis cache.
- Origin Private File System for an optional latest-index snapshot when available.

## Network

The distributed app has Vercel Web Analytics for page traffic, but no CDN dependencies, account system, or workspace upload path. The HTML Content Security Policy sets `connect-src 'self'` so analytics requests stay same-origin on Vercel.

## User Control

Users can clear the workspace and clear the local analysis cache from the app. Browser site-data controls can remove all local settings, presets, and caches.
