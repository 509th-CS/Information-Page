"use strict";
(function () {
  const $ = id => document.getElementById(id);
  const tell = message => { $('status').textContent = message; };
  const STORAGE_KEY = 'information-page-posts-v1';
  const categories = ['Information','News','Help','Resources','Newcomers'];
  for (const name of categories) {
    for (const id of ['filter','post-category']) {
      const option = document.createElement('option'); option.value = name; option.textContent = name; $(id).append(option);
    }
  }
  let posts = [], editing = null;
  function readStore() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(data) ? data.filter(p => p && typeof p === 'object' && p.id) : [];
    } catch (e) { return []; }
  }
  function writeStore() { localStorage.setItem(STORAGE_KEY, JSON.stringify(posts)); }
  function newId() {
    return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString(36)+Math.random().toString(36).slice(2);
  }
  function sortPosts() {
    posts.sort((a,b) => (Number(!!b.pinned) - Number(!!a.pinned)) || (new Date(b.updated_at) - new Date(a.updated_at)));
  }
  function normalizeCategory(category) {
    return categories.includes(category) ? category : 'Information';
  }
  function load() {
    posts = readStore().map(post => ({ ...post, category: normalizeCategory(post.category) }));
    sortPosts();
    render();
  }
  function hideEditor() { $('editor').hidden = true; $('post-form').reset(); editing = null; }
  function showEditor(post = null) {
    editing = post ? post.id : null;
    $('post-title').value = post ? post.title : '';
    $('post-body').value = post ? post.body : '';
    $('post-category').value = post ? normalizeCategory(post.category) : 'Information';
    $('post-pinned').checked = post ? !!post.pinned : false;
    $('editor-title').textContent = post ? 'Edit post' : 'Create post';
    $('editor').hidden = false; $('editor').scrollIntoView({behavior:'smooth'});
  }
  function render() {
    const term = $('search').value.toLowerCase();
    const category = $('filter').value;
    $('posts').replaceChildren();
    const filtered = posts.filter(p => (!category || p.category === category) && ((p.title||'')+' '+(p.body||'')).toLowerCase().includes(term));
    if (!filtered.length) { const p = document.createElement('p'); p.textContent = 'No posts to display.'; $('posts').append(p); }
    for (const post of filtered) {
      const card = document.createElement('article'); card.className = 'card';
      const meta = document.createElement('small'); meta.textContent = post.category + (post.pinned ? ' · PINNED' : '');
      const title = document.createElement('h2'); title.textContent = post.title;
      const body = document.createElement('div'); body.className = 'post-body'; body.textContent = post.body;
      const date = document.createElement('p'); date.className = 'muted'; date.textContent = 'Updated '+new Date(post.updated_at).toLocaleString();
      const edit = document.createElement('button'); edit.textContent = 'Edit'; edit.onclick = () => showEditor(post);
      const del = document.createElement('button'); del.textContent = 'Delete'; del.className = 'danger';
      del.onclick = () => {
        if (!confirm('Permanently delete "'+post.title+'"?')) return;
        try {
          posts = posts.filter(p => p.id !== post.id); writeStore(); render(); tell('Post deleted.');
        } catch(e) { load(); tell('Delete failed: '+e.message); }
      };
      card.append(meta,title,body,date,edit,del);
      $('posts').append(card);
    }
  }
  $('new-post').onclick = () => showEditor();
  $('cancel').onclick = hideEditor;
  $('search').oninput = render; $('filter').onchange = render;
  $('refresh').onclick = () => { load(); tell('Posts reloaded from this browser.'); };
  $('post-form').onsubmit = e => {
    e.preventDefault();
    const title = $('post-title').value.trim(), body = $('post-body').value.trim();
    try {
      if (!title || !body) throw new Error('Title and information are required.');
      const now = new Date().toISOString();
      const fields = {title, body, category:normalizeCategory($('post-category').value), pinned:$('post-pinned').checked, updated_at:now};
      const existing = editing && posts.find(p => p.id === editing);
      if (existing) Object.assign(existing, fields);
      else posts.push(Object.assign({id:newId(), created_at:now}, fields));
      sortPosts(); writeStore(); hideEditor(); render(); tell('Post saved.');
    } catch(err) { load(); tell('Save failed: '+err.message); }
  };
  try { load(); tell('Ready. Posts are stored in this browser only.'); }
  catch(err) { tell('Unable to start: '+err.message); }
})();
