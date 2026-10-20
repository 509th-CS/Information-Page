import os, sqlite3, secrets
from datetime import timedelta
from functools import wraps
import click
from flask import Flask, render_template, request, redirect, url_for, session, g, abort, flash
from flask_wtf.csrf import CSRFProtect
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.config.update(SECRET_KEY=os.environ.get('SECRET_KEY') or secrets.token_hex(32),
    SESSION_COOKIE_HTTPONLY=True, SESSION_COOKIE_SAMESITE='Lax',
    SESSION_COOKIE_SECURE=os.environ.get('HTTPS_ONLY') == '1',
    PERMANENT_SESSION_LIFETIME=timedelta(minutes=30), MAX_CONTENT_LENGTH=128*1024)
DB = os.environ.get('DATABASE_PATH', os.path.join(app.instance_path, 'site.db'))
os.makedirs(os.path.dirname(os.path.abspath(DB)), exist_ok=True)
CSRFProtect(app)
limiter = Limiter(get_remote_address, app=app, storage_uri=os.environ.get('RATELIMIT_STORAGE_URI','memory://'))

def db():
    if 'db' not in g:
        g.db = sqlite3.connect(DB)
        g.db.row_factory = sqlite3.Row
    return g.db

@app.teardown_appcontext
def close_db(error):
    if 'db' in g: g.pop('db').close()

@app.before_request
def load_user():
    g.user = db().execute('SELECT * FROM users WHERE id=?', (session['uid'],)).fetchone() if 'uid' in session else None

@app.after_request
def headers(response):
    response.headers['Cache-Control'] = 'no-store'
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['Referrer-Policy'] = 'no-referrer'
    response.headers['Content-Security-Policy'] = "default-src 'self'; style-src 'self'; script-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"
    if app.config['SESSION_COOKIE_SECURE']:
        response.headers['Strict-Transport-Security'] = 'max-age=31536000'
    return response

def access(admin=False):
    def decorator(fn):
        @wraps(fn)
        def wrapped(*args, **kwargs):
            if g.user is None: return redirect(url_for('login'))
            if admin and g.user['role'] != 'admin': abort(403)
            return fn(*args, **kwargs)
        return wrapped
    return decorator

@app.route('/login', methods=['GET','POST'])
@limiter.limit('10 per minute', methods=['POST'])
def login():
    if request.method == 'POST':
        user = db().execute('SELECT * FROM users WHERE username=?', (request.form.get('username','').strip().lower(),)).fetchone()
        valid = check_password_hash(user['password'] if user else DUMMY_HASH, request.form.get('password',''))
        if user and valid:
            session.clear(); session['uid'] = user['id']; session.permanent = True
            return redirect(url_for('home'))
        flash('Unable to sign in. Check your username and password.')
    return render_template('login.html')

DUMMY_HASH = generate_password_hash(secrets.token_hex(32))

@app.post('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

@app.get('/')
@access()
def home():
    category = request.args.get('category','')
    query = request.args.get('q','').strip()[:100]
    posts = db().execute("SELECT * FROM posts WHERE (?='' OR category=?) AND (title LIKE ? OR body LIKE ?) ORDER BY pinned DESC, updated DESC, id DESC", (category,category,'%'+query+'%','%'+query+'%')).fetchall()
    return render_template('home.html', posts=posts, category=category, query=query)

@app.route('/editor', methods=['GET','POST'])
@app.route('/editor/<int:post_id>', methods=['GET','POST'])
@access(admin=True)
def editor(post_id=None):
    post = db().execute('SELECT * FROM posts WHERE id=?',(post_id,)).fetchone() if post_id else None
    if post_id and post is None: abort(404)
    if request.method == 'POST':
        title = request.form.get('title','').strip()
        body = request.form.get('body','').strip()
        category = request.form.get('category','General')
        if not title or len(title)>160 or not body or len(body)>20000 or category not in CATEGORIES: abort(400)
        values = (title, body, category, int(request.form.get('pinned')=='on'))
        if post:
            db().execute("UPDATE posts SET title=?, body=?, category=?, pinned=?, updated=CURRENT_TIMESTAMP WHERE id=?",values+(post_id,))
        else:
            db().execute('INSERT INTO posts(title,body,category,pinned) VALUES(?,?,?,?)',values)
        db().commit(); flash('Post saved.'); return redirect(url_for('home'))
    return render_template('editor.html', post=post)

@app.post('/delete/<int:post_id>')
@access(admin=True)
def delete(post_id):
    db().execute('DELETE FROM posts WHERE id=?',(post_id,)); db().commit()
    flash('Post deleted.'); return redirect(url_for('home'))

CATEGORIES = ['General','Announcements','Career & Training','Benefits & Support','Community','Resources']
@app.context_processor
def defaults():
    return dict(site_title='509th Communication Squadron: Information Page', categories=CATEGORIES)

@app.cli.command('init-db')
def init_db():
    db().executescript("""CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY,username TEXT UNIQUE NOT NULL,password TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN ('admin','member')));
    CREATE TABLE IF NOT EXISTS posts(id INTEGER PRIMARY KEY,title TEXT NOT NULL,body TEXT NOT NULL,category TEXT NOT NULL,pinned INTEGER NOT NULL DEFAULT 0,updated TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);""")
    db().commit(); click.echo('Database ready.')

@app.cli.command('create-user')
@click.argument('username')
@click.option('--role',type=click.Choice(['admin','member']),default='member')
@click.password_option()
def create_user(username,role,password):
    if len(password)<14: raise click.ClickException('Use at least 14 characters.')
    try:
        db().execute('INSERT INTO users(username,password,role) VALUES(?,?,?)',(username.strip().lower(),generate_password_hash(password),role)); db().commit()
    except sqlite3.IntegrityError: raise click.ClickException('Username already exists.')
    click.echo('User created.')

@app.cli.command('reset-password')
@click.argument('username')
@click.password_option()
def reset_password(username,password):
    if len(password)<14: raise click.ClickException('Use at least 14 characters.')
    result=db().execute('UPDATE users SET password=? WHERE username=?',(generate_password_hash(password),username.strip().lower()))
    db().commit(); click.echo('Password updated.' if result.rowcount else 'No such user.')

@app.cli.command('remove-user')
@click.argument('username')
@click.confirmation_option(prompt='Remove this user?')
def remove_user(username):
    db().execute('DELETE FROM users WHERE username=?',(username.strip().lower(),)); db().commit()
    click.echo('User removed; existing sessions will lose access on their next request.')
