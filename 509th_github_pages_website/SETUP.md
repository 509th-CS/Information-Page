# GitHub Pages setup

This package replaces the earlier Python application. No Python, build step or Node installation is needed for GitHub Pages. It is a prototype, not a security-certified or approved DoD system. No operational/private content should be added before organizational approval and a security review.

## 1. Publish the visible website
Extract this ZIP. Upload index.html, style.css, app.js, config.js, and .nojekyll to the TOP LEVEL of the GitHub repository (not inside an extra folder). Keep SETUP.md and database.sql locally if desired; they contain no credentials or private records. Remove the previous Flask files if you no longer need them. Do not delete unrelated files without a backup.

Repository Settings -> Pages -> Build and deployment -> Deploy from a branch -> select main and /(root) -> Save. If your branch has another name, select that branch. Wait for the deployment to complete, then use Visit site in Settings -> Pages. You should see the header, welcome section and setup notice even before the backend is connected. Use a hard refresh if your browser shows an old version.

Relative asset paths support both account sites and repository subpath sites. If you already use a GitHub Actions publishing workflow, its published artifact must contain these files at its root; changing files on main alone may not change that artifact. Use the branch publishing configuration above for this package.

## 2. Create the authentication/database backend
GitHub Pages serves public static files; it cannot run the prior Python backend. This version uses Supabase Auth and database Row Level Security (RLS) to restrict the DATA, not the public HTML shell. Your site branding and sign-in page remain public. If even the shell must be private, this architecture is not sufficient: use an eligible private GitHub Pages configuration or an approved private hosting platform instead.

Create a Supabase project in an account authorized for your prototype. In SQL Editor, run database.sql ONCE on a new project. It creates posts and memberships with database-enforced authorization. Do not skip this step or disable RLS. Do not use this app with tables from a different schema/setup unless reviewed.

Under Authentication settings, enable email/password sign-in and disable public/new-user signups. Create users from the Authentication Users dashboard using its Add/Create user option, setting a unique strong temporary password and confirming the email as appropriate. No email invitation callback or self-service password recovery flow is implemented in this starter. Use dashboard password management for initial setup and resets. Do not reuse government passwords or CAC PINs.

Copy each created user's UUID. In SQL Editor, approve your first administrator:

    insert into public.memberships(user_id, role)
    values ('REPLACE_WITH_ADMIN_USER_UUID', 'admin');

Approve another user as a member:

    insert into public.memberships(user_id, role)
    values ('REPLACE_WITH_MEMBER_USER_UUID', 'member');

Never put actual membership inserts, emails or UUID lists in a public repository. Memberships are managed through the trusted dashboard/SQL Editor, not the website.

## 3. Connect your public frontend
In Supabase project settings, copy the project URL and PUBLISHABLE API key. Edit config.js:

    window.SITE_CONFIG = {
      supabaseUrl: "https://YOUR_PROJECT.supabase.co",
      supabasePublishableKey: "sb_publishable_YOUR_KEY"
    };

These placeholders must be replaced. The browser publishable key is intentionally public; RLS protects the records. NEVER paste a secret key, service_role key, database password or user password into these files. Do not send those credentials to anyone helping configure this.

Commit the updated config.js and wait for GitHub Pages to deploy. Sign in with your administrator email and password; New post should appear. Use it to add, edit, pin and delete plain-text posts. URLs appear as text, not clickable links. Reloading the page requires signing in again: sessions are intentionally kept in memory rather than browser localStorage.

## 4. Verify restrictions before sharing
Use only dummy test posts:
- A signed-out browser must show no posts.
- An authenticated account with no membership must show no posts.
- An approved member may read but must not be able to insert, update or delete posts, even by directly calling the Supabase API.
- An administrator may create, edit and delete posts.
- Users must not be able to change their own membership/role through the API.
- Remove a membership in SQL Editor to revoke future database access:

    delete from public.memberships where user_id = 'REPLACE_WITH_USER_UUID';

Already displayed/downloaded content cannot be recalled. The UI clears content when signing out, but a person who has read a post can retain a copy. The prototype does not continuously poll for revocations; Refresh rechecks membership and future database requests enforce it immediately.

## Editing source and content
index.html: title, hero introduction, footer and fixed labels.
style.css: navy/gold colors, spacing and layout.
app.js and database.sql: categories (change both consistently).
Posts: edit through the administrator screen; stored only in Supabase, not GitHub. Memberships: trusted Supabase dashboard only. There is no public registration, file upload, rich HTML, audit log, MFA flow, CAC integration or self-service password reset implemented.

## Security and deployment limitations
This is not an approved system for CUI, classified information, PII/personnel records or operationally sensitive information. Public GitHub repositories must never contain private posts, credentials, or rosters. A private repository usually does not make its Pages site private. Obtain organizational and hosting approval before real use.

The client loads supabase-js v2 from the third-party esm.sh CDN at runtime; network policy or CDN failure may block sign-in, but an error will be displayed. For a reviewed production deployment, bundle and pin dependencies and review content-security policy, identity/MFA requirements, abuse/rate limiting, database grants/policies, project configuration, backups, recovery, retention, logging and cost/quotas. Supabase is an external service with its own plan limits and account requirements. Use only approved hosting/services for actual organizational workloads.

No remote deployment, Supabase project creation, or end-to-end authentication test has been performed. HTML structure, local asset references, and ZIP integrity were checked during generation. Test in your environment before relying on it.

Troubleshooting: a setup notice means config.js has empty values; a start error may indicate a bad URL/key or blocked CDN; missing relation means database.sql was not run; account not approved means the UUID has no membership row. Use browser developer tools Console/Network for details; never post access tokens or passwords publicly.

Sources: https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site ; https://supabase.com/docs/guides/database/postgres/row-level-security ; https://supabase.com/docs/guides/getting-started/api-keys
