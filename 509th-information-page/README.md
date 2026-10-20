# 509th Communication Squadron: Information Page

A working Flask starter application, not a hosted website or approved military information system. The title matches the requested wording exactly. Navy-and-gold styling is editable in static/style.css.

## Included
- Server-side login required for the information page and editing routes.
- Administrator-created accounts; no public registration or default passwords.
- Members read; administrators create, edit, pin, and delete posts.
- Search and category filters. Plain-text content with HTML escaping.
- SQLite persistence, hashed passwords, CSRF protection, login rate limiting, and security headers.
- Responsive layout with no external fonts, scripts, or tracking.

## Local setup (Python 3.10 or newer)
Extract the ZIP. Open a terminal in the extracted project folder.

    python -m venv .venv

Windows PowerShell activation:

    .venv\Scripts\Activate.ps1

macOS / Linux activation:

    source .venv/bin/activate

Then:

    python -m pip install -r requirements.txt
    python -m flask --app app init-db
    python -m flask --app app create-user administrator --role admin
    python -m flask --app app create-user member1 --role member
    python -m flask --app app run --host 127.0.0.1

Passwords are prompted privately; use a unique password of at least 14 characters. Open http://127.0.0.1:5000 in your browser. Sign in as administrator and choose New post. Local development uses HTTP and is intended only for your own machine.

## Manage accounts
From the application directory and activated environment:

    python -m flask --app app reset-password member1
    python -m flask --app app remove-user member1

Deletion revokes access on the next request. Password reset does NOT revoke an existing session. Sessions expire after 30 minutes of inactivity. No web user-management interface, email recovery, MFA, CAC, or SSO is implemented.

## Edit the code
- templates/base.html: shared header and footer.
- templates/home.html: landing page structure and introduction.
- templates/editor.html: post form.
- static/style.css: colors, spacing, responsive styles.
- app.py: site title, categories, routes and database behavior.
Edit static text in these files; edit published posts in the signed-in editor. Posts are stored in SQLite, not source files. URLs in posts are plain text, not clickable links. File uploads are intentionally not implemented.

## Deployment is a separate step
Do not put this prototype on the public Internet as-is. It has not had a production security review. Use an organization-approved environment and get the required approvals before using a unit name for an operational site. A normal static-file host alone cannot run this Flask application.

Configure a stable random SECRET_KEY through a hosting secret manager (generate with python -c "import secrets; print(secrets.token_hex(32))"). Without it, the application generates a temporary key and users are logged out when the process restarts. Do not commit secrets to a repository.
Set HTTPS_ONLY=1 only when serving through correctly configured HTTPS; secure cookies will not work over plain local HTTP. Use TLS, a production WSGI server such as Waitress behind an approved gateway, persistent storage, restrictive OS permissions for the database, encrypted backups, monitoring, patching and a tested restore procedure. Bind Waitress to the loopback interface behind the gateway, for example:

    waitress-serve --listen=127.0.0.1:8080 app:app

Set DATABASE_PATH to an absolute path on persistent storage if necessary. Initialize that same database before launch. The in-memory rate limiter is per-process, resets on restart, and is not a distributed production defense. Configure RATELIMIT_STORAGE_URI with an appropriate shared backend and its client dependencies before multi-instance use. Correct client-IP handling depends on the deployment architecture; do not blindly trust forwarded headers. Add edge abuse protection, organization-approved identity/MFA, audit logging, and security review before real deployment. All members can read all posts; per-post groups are not supported.

## Information restrictions
A password does not make this an authorized DoD system. Use only information approved for public release for prototyping. Do not enter classified material, CUI, personnel records, credentials, network diagrams, mission schedules, or sensitive operational information. Local SQLite content is not encrypted by this application. This prototype asserts no official affiliation or authorization.

Guidance consulted:
- https://flask.palletsprojects.com/en/stable/deploying/
- https://www.cdse.edu/Training/Toolkits/Controlled-Unclassified-Information-Toolkit/

## Verification
Python syntax and package structure were checked during generation. A full installed-dependency runtime/browser test and deployment security review are still required; do not treat this package as certified or production-ready.
