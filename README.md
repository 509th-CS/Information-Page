# Information-Page

A backend-free static information board. Posts are stored in the browser's `localStorage`; access is gated by a client-side password prompt; there is no database or server.

## Categories

- Information
- News
- Help
- Resources
- Newcomers

## Deployment (GitHub Pages)
The authoritative site files are at the repository root: `index.html`, `app.js`, `style.css` (plus an empty `.nojekyll`).

1. Settings -> Pages -> Build and deployment -> Deploy from a branch.
2. Select the `main` branch and `/ (root)`, then Save.
3. Open https://codytuttle2004-max.github.io/Information-Page/

To try locally: run `python3 -m http.server` in the repo root and open http://localhost:8000.

## Usage
Create, edit, pin and delete plain-text posts; search and filter by category. Pinned posts sort first, then most recently updated.

## localStorage limitations
- Posts are per browser and per device; they are not shared with other visitors.
- Clearing site data, private browsing or storage eviction deletes posts.
- No access control or backup; browser quota (~5 MB) applies.
- Do not store sensitive data.

## Legacy folder
`509th_github_pages_website/` is kept for reference (including unused Supabase-era `config.js`/`database.sql`). Root files are what Pages serves.

## Password protection
`gate.js` shows a password prompt before the page content is revealed; `app.js` is only loaded after a correct password.

**Setup:** the default password is `19754`. Change it by computing a SHA-256 hex digest (`printf 'newpass' | sha256sum`) and replacing `PASSWORD_HASH` in `gate.js`. Changing the hash also signs everyone out immediately.

**10-session remember:** after a correct password, the browser remembers it in `localStorage` for 10 browser sessions (the session you log in during counts as 1); the prompt returns at the 11th. A session means each browser run/tab lifecycle.

**Limitations:**
- This is a static site, so protection is client-side only: it is a deterrent, not real security. The hash, HTML and scripts are publicly downloadable, and anyone can edit their own `localStorage`.
- Clearing site data or private/incognito windows resets the counter, so the password is requested again.
- If storage is blocked, the password is requested on every visit.
- Hashing uses `crypto.subtle`, which needs HTTPS or `localhost` (GitHub Pages is fine).
