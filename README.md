# Information-Page

A backend-free static information board. Posts are stored in the browser's `localStorage`; there is no sign-in, database or server.

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
