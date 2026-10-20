"use strict";
(async function () {
  const $ = id => document.getElementById(id);
  const tell = message => { $('status').textContent = message; };
  const categories = ['General','Announcements','Career & Training','Benefits & Support','Community','Resources'];
  for (const name of categories) {
    for (const id of ['filter','post-category']) {
      const option = document.createElement('option'); option.value = name; option.textContent = name; $(id).append(option);
    }
  }
  const config = window.SITE_CONFIG || {};
  if (!config.supabaseUrl || !config.supabasePublishableKey) {
    $('setup').hidden = false; tell('Setup required: connect your authentication and database.'); return;
  }
  let client, role = null, posts = [], editing = null;
  function clearPrivate() {
    role = null; posts = []; editing = null;
    $('posts').replaceChildren(); $('post-form').reset();
    $('hub').hidden = true; $('editor').hidden = true; $('new-post').hidden = true;
    $('identity').textContent = '';
  }
  function showEditor(post = null) {
    editing = post ? post.id : null;
    $('post-title').value = post ? post.title : '';
    $('post-body').value = post ? post.body : '';
    $('post-category').value = post ? post.category : 'General';
    $('post-pinned').checked = post ? post.pinned : false;
    $('editor-title').textContent = post ? 'Edit post' : 'Create post';
    $('editor').hidden = false; $('editor').scrollIntoView({behavior:'smooth'});
  }
  function render() {
    const term = $('search').value.toLowerCase();
    const category = $('filter').value;
    $('posts').replaceChildren();
    const filtered = posts.filter(p => (!category || p.category === category) && (p.title+' '+p.body).toLowerCase().includes(term));
    if (!filtered.length) { const p = document.createElement('p'); p.textContent = 'No posts to display.'; $('posts').append(p); }
    for (const post of filtered) {
      const card = document.createElement('article'); card.className = 'card';
      const meta = document.createElement('small'); meta.textContent = post.category + (post.pinned ? ' · PINNED' : '');
      const title = document.createElement('h2'); title.textContent = post.title;
      const body = document.createElement('div'); body.className = 'post-body'; body.textContent = post.body;
      const date = document.createElement('p'); date.className = 'muted'; date.textContent = 'Updated '+new Date(post.updated_at).toLocaleString();
      card.append(meta,title,body,date);
      if (role === 'admin') {
        const edit = document.createElement('button'); edit.textContent = 'Edit'; edit.onclick = () => showEditor(post);
        const del = document.createElement('button'); del.textContent = 'Delete'; del.className = 'danger';
        del.onclick = async () => {
          if (!confirm('Permanently delete "'+post.title+'"?')) return;
          try {
            const {data,error} = await client.from('posts').delete().eq('id',post.id).select('id');
            if (error) throw error;
            if (!data.length) throw new Error('Deletion was not permitted.');
            await load(); tell('Post deleted.');
          } catch(e) { tell('Delete failed: '+e.message); }
        };
        card.append(edit,del);
      }
      $('posts').append(card);
    }
  }
  async function load() {
    const {data,error} = await client.from('posts').select('*').order('pinned',{ascending:false}).order('updated_at',{ascending:false});
    if (error) { posts = []; render(); throw error; }
    posts = data || []; render();
  }
  async function sync() {
    clearPrivate(); $('login').hidden = true;
    const {data,error} = await client.auth.getUser();
    if (error || !data.user) { $('login').hidden = false; tell('Sign in to view restricted posts.'); return; }
    const result = await client.from('memberships').select('role').eq('user_id',data.user.id).maybeSingle();
    if (result.error) throw result.error;
    if (!result.data) {
      $('hub').hidden = false; tell('Your account is not approved. Contact the administrator, or sign out.'); return;
    }
    role = result.data.role;
    $('identity').textContent = data.user.email+' · '+role;
    $('hub').hidden = false; $('new-post').hidden = role !== 'admin';
    await load(); tell('Signed in.');
  }
  try {
    const module = await import('https://esm.sh/@supabase/supabase-js@2');
    client = module.createClient(config.supabaseUrl,config.supabasePublishableKey,{auth:{persistSession:false,autoRefreshToken:true,detectSessionInUrl:false}});
    $('login-form').onsubmit = async e => {
      e.preventDefault(); $('signin').disabled = true; tell('Signing in…');
      try {
        const {error} = await client.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value});
        $('password').value = ''; if(error) throw error; await sync();
      } catch(err) { clearPrivate(); $('login').hidden = false; tell('Sign-in failed: '+err.message); }
      finally { $('signin').disabled = false; }
    };
    $('signout').onclick = async () => {
      const {error} = await client.auth.signOut({scope:'local'});
      clearPrivate(); $('login').hidden = false; tell(error ? 'Sign-out error: '+error.message : 'Signed out.');
    };
    $('new-post').onclick = () => showEditor();
    $('cancel').onclick = () => { $('editor').hidden = true; $('post-form').reset(); editing = null; };
    $('search').oninput = render; $('filter').onchange = render;
    $('refresh').onclick = () => sync().catch(err => tell('Refresh failed: '+err.message));
    $('post-form').onsubmit = async e => {
      e.preventDefault(); if(role !== 'admin') return;
      $('save').disabled = true;
      const payload = {title:$('post-title').value.trim(),body:$('post-body').value.trim(),category:$('post-category').value,pinned:$('post-pinned').checked};
      try {
        if (!payload.title || !payload.body) throw new Error('Title and information are required.');
        const action = editing ? client.from('posts').update(payload).eq('id',editing) : client.from('posts').insert(payload);
        const {data,error} = await action.select('id'); if (error) throw error;
        if (!data.length) throw new Error('Save was not permitted.');
        $('editor').hidden = true; $('post-form').reset(); editing = null; await load(); tell('Post saved.');
      } catch(err) { tell('Save failed: '+err.message); }
      finally { $('save').disabled = false; }
    };
    client.auth.onAuthStateChange(event => {
      if(event === 'SIGNED_OUT') { clearPrivate(); $('login').hidden = false; tell('Please sign in.'); }
    });
    await sync();
  } catch(err) { tell('Unable to start: '+err.message+'. Check config.js, database setup, and your network connection.'); }
})();
