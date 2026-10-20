# GitHub Pages setup (no backend)

This site is fully static: only index.html, style.css and app.js are needed. There is no sign-in, no database and no server. It is a prototype, not a security-certified or approved DoD system. Do not add operational/private content.

## 1. Publish
Upload index.html, style.css and app.js (and optionally an empty .nojekyll) to the top level of the repository, or keep them in this folder and publish that folder with your own workflow. Then: Repository Settings -> Pages -> Build and deployment -> Deploy from a branch -> select main and /(root) -> Save. Wait for deployment and use Visit site. Relative asset paths work for account sites and repository subpath sites.

To try it locally, open index.html in a browser (or run `python3 -m http.server` in this folder).

## 2. Using the site
Anyone opening the page can create, edit, pin and delete plain-text posts, and search/filter by category. Pinned posts sort first, then newest update. Editing a post refreshes its Updated time. URLs appear as text, not links.

## 3. Data persistence limitations
Posts are saved in the browser's localStorage (key `information-page-posts-v1`):
- Data is per browser and per device. It is NOT shared between users or devices, and is not visible to other visitors.
- Clearing site data/cookies, private browsing, or browser storage eviction deletes the posts.
- There is no access control: anyone using the browser can edit or delete posts.
- There is no backup. Browser storage quotas (roughly 5 MB) apply.
Do not store sensitive, CUI, classified, PII or credential data.

## Legacy files
database.sql and config.js belong to the earlier Supabase-backed prototype. They are not used or loaded by the site and can be deleted. No Supabase setup is required.

## Editing source
index.html: title, hero text, footer. style.css: colors and layout. app.js: categories list.
