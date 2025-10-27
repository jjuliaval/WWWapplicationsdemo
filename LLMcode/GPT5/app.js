/* SafeStore - vanilla JS MVP
 * Features: client-only auth, roles, notes CRUD + search,
 * file metadata with data URLs, remote image preview via fetch,
 * admin panel, and audit log. All data persists in localStorage.
 */
(() => {
  // --- Storage keys
  const K = {
    users: 'safestore_users',
    notes: 'safestore_notes',
    files: 'safestore_files',
    session: 'safestore_session',
    audit: 'safestore_audit'
  };

  // --- DOM elements
  const el = {
    userStatus: document.getElementById('userStatus'),
    logoutBtn: document.getElementById('logoutBtn'),
    authSection: document.getElementById('authSection'),
    loginForm: document.getElementById('loginForm'),
    loginEmail: document.getElementById('loginEmail'),
    loginPassword: document.getElementById('loginPassword'),
    registerForm: document.getElementById('registerForm'),
    regEmail: document.getElementById('regEmail'),
    regPassword: document.getElementById('regPassword'),
    regRole: document.getElementById('regRole'),
    authMsg: document.getElementById('authMsg'),

    notesSection: document.getElementById('notesSection'),
    notesList: document.getElementById('notesList'),
    noteSearchInput: document.getElementById('noteSearchInput'),
    noteTitleInput: document.getElementById('noteTitleInput'),
    noteContentEditable: document.getElementById('noteContentEditable'),
    saveNoteBtn: document.getElementById('saveNoteBtn'),
    newNoteBtn: document.getElementById('newNoteBtn'),
    deleteNoteBtn: document.getElementById('deleteNoteBtn'),
    noteMsg: document.getElementById('noteMsg'),

    filesSection: document.getElementById('filesSection'),
    fileInput: document.getElementById('fileInput'),
    fileList: document.getElementById('fileList'),
    fileMsg: document.getElementById('fileMsg'),

    imageSection: document.getElementById('imageSection'),
    imageUrlInput: document.getElementById('imageUrlInput'),
    previewImageBtn: document.getElementById('previewImageBtn'),
    imageFetchStatus: document.getElementById('imageFetchStatus'),
    imagePreview: document.getElementById('imagePreview'),

    adminSection: document.getElementById('adminSection'),
    adminUsersList: document.getElementById('adminUsersList'),
    adminNotesList: document.getElementById('adminNotesList'),
    adminFilesList: document.getElementById('adminFilesList'),

    auditSection: document.getElementById('auditSection'),
    auditLogList: document.getElementById('auditLogList'),
  };

  // --- In-memory state
  let selectedNoteId = null;

  // --- Utilities
  const read = (k, d=[]) => {
    try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; }
  };
  const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const uuid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
  const nowISO = () => new Date().toISOString();

  // --- Audit logging
  function logAudit(action, details) {
    const a = read(K.audit, []);
    a.unshift({ time: nowISO(), action, details });
    write(K.audit, a);
    renderAudit();
  }
  function renderAudit() {
    const a = read(K.audit, []);
    el.auditLogList.innerHTML = a.map(x => `<li><strong>${x.action}</strong> <span class="meta">${x.time}</span><br>${escapeHTML(shorten(JSON.stringify(x.details)))}</li>`).join('');
  }

  // --- Auth
  function usersAll() { return read(K.users, []); }
  function setUsers(all) { write(K.users, all); }
  function findUserByEmail(email) { return usersAll().find(u => u.email === email); }

  function register(email, password, role) {
    email = email.trim().toLowerCase();
    if (!email || !password) return msg(el.authMsg, 'Email and password required', true);
    if (findUserByEmail(email)) return msg(el.authMsg, 'User already exists', true);
    const user = { id: uuid(), email, password, role: role === 'admin' ? 'admin' : 'user', createdAt: nowISO() };
    const all = usersAll(); all.push(user); setUsers(all);
    msg(el.authMsg, 'Registered. Please login.', false);
    logAudit('register', { email, role: user.role });
  }

  function login(email, password) {
    const u = findUserByEmail((email||'').trim().toLowerCase());
    if (!u || u.password !== password) return msg(el.authMsg, 'Invalid credentials', true);
    const token = { token: uuid(), userId: u.id, email: u.email, role: u.role, createdAt: nowISO() };
    write(K.session, token);
    logAudit('login', { email: u.email, role: u.role });
    hydrateUI();
  }

  function logout() {
    localStorage.removeItem(K.session);
    logAudit('logout', {});
    hydrateUI();
  }

  function session() {
    try { return JSON.parse(localStorage.getItem(K.session)); } catch { return null; }
  }
  function isLoggedIn() { return !!session(); }
  function isAdmin() { return session()?.role === 'admin'; }

  // --- Notes
  function notesAll() { return read(K.notes, []); }
  function setNotes(all) { write(K.notes, all); }
  function notesByUser(userId) { return notesAll().filter(n => n.ownerId === userId); }
  function getNote(id) { return notesAll().find(n => n.id === id) || null; }

  function saveCurrentNote() {
    const s = session(); if (!s) return;
    const title = el.noteTitleInput.value.trim();
    const contentHtml = el.noteContentEditable.innerHTML.trim();
    if (!title && !contentHtml) return msg(el.noteMsg, 'Nothing to save', true);
    let all = notesAll();
    if (!selectedNoteId) {
      const n = { id: uuid(), ownerId: s.userId, title, contentHtml, updatedAt: nowISO() };
      all.push(n); setNotes(all); selectedNoteId = n.id;
      logAudit('note_created', { title });
    } else {
      all = all.map(n => n.id === selectedNoteId ? { ...n, title, contentHtml, updatedAt: nowISO() } : n);
      setNotes(all);
      logAudit('note_updated', { id: selectedNoteId, title });
    }
    msg(el.noteMsg, 'Saved', false);
    renderNotesList();
  }
  function deleteCurrentNote() {
    if (!selectedNoteId) return msg(el.noteMsg, 'No note selected', true);
    const n = getNote(selectedNoteId);
    setNotes(notesAll().filter(x => x.id !== selectedNoteId));
    logAudit('note_deleted', { id: selectedNoteId, title: n?.title });
    selectedNoteId = null;
    el.noteTitleInput.value = '';
    el.noteContentEditable.innerHTML = '';
    msg(el.noteMsg, 'Deleted', false);
    renderNotesList();
  }
  function renderNotesList() {
    const s = session(); if (!s) return;
    const q = (el.noteSearchInput.value||'').toLowerCase();
    const list = notesByUser(s.userId).filter(n => !q || n.title.toLowerCase().includes(q) || (n.contentHtml||'').toLowerCase().includes(q));
    el.notesList.innerHTML = list.map(n => `<li data-id="${n.id}"><span>${escapeHTML(n.title||'(untitled)')}</span><span class="meta">${n.updatedAt}</span></li>`).join('');
    [...el.notesList.querySelectorAll('li')].forEach(li => li.addEventListener('click', () => {
      const id = li.getAttribute('data-id'); const n = getNote(id); if (!n) return;
      selectedNoteId = id; el.noteTitleInput.value = n.title || '';
      el.noteContentEditable.innerHTML = n.contentHtml || '';
    }));
  }

  // --- Files (metadata + dataURL)
  function filesAll() { return read(K.files, []); }
  function setFiles(all) { write(K.files, all); }
  function filesByUser(userId) { return filesAll().filter(f => f.ownerId === userId); }

  function handleFile(file) {
    if (!file) return;
    const s = session(); if (!s) return msg(el.fileMsg, 'Login required', true);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const rec = {
        id: uuid(), ownerId: s.userId,
        name: file.name, size: file.size, type: file.type,
        lastModified: file.lastModified, dataUrl, savedAt: nowISO()
      };
      const all = filesAll(); all.push(rec); setFiles(all);
      el.fileInput.value = '';
      logAudit('file_saved', { name: file.name, size: file.size, type: file.type });
      msg(el.fileMsg, 'File metadata saved', false);
      renderFiles();
    };
    reader.onerror = () => msg(el.fileMsg, 'Failed to read file', true);
    reader.readAsDataURL(file);
  }
  function dataURLToBlob(u) {
    const parts = u.split(','), meta = parts[0], data = parts[1];
    const mime = (meta.match(/data:(.*);base64/)||[])[1]||'application/octet-stream';
    const bin = atob(data); const arr = new Uint8Array(bin.length);
    for (let i=0;i<bin.length;i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }
  function renderFiles() {
    const s = session(); if (!s) return;
    const list = filesByUser(s.userId);
    el.fileList.innerHTML = list.map(f => {
      const blob = dataURLToBlob(f.dataUrl);
      const url = URL.createObjectURL(blob);
      return `<li><span>${escapeHTML(f.name)}</span><span class="meta">${f.type||'unknown'} · ${fmtBytes(f.size)} · ${f.savedAt}</span> <a href="${url}" download="${escapeAttr(f.name)}">Download</a></li>`;
    }).join('');
  }

  // --- Remote image preview via fetch()
  async function previewRemoteImage(url) {
    el.imageFetchStatus.textContent = 'Loading...';
    el.imagePreview.removeAttribute('src');
    const img = el.imagePreview;
    img.referrerPolicy = 'no-referrer';
    img.crossOrigin = 'anonymous';
    const onLoad = () => {
      el.imageFetchStatus.textContent = 'Loaded (embedded)';
      logAudit('image_preview', { url, ok: true, method: 'img' });
      img.removeEventListener('load', onLoad);
      img.removeEventListener('error', onError);
    };
    const onError = () => {
      el.imageFetchStatus.textContent = 'Image failed to load. Trying fetch…';
      img.removeEventListener('load', onLoad);
      img.removeEventListener('error', onError);
      fetchViaBlob(url);
    };
    img.addEventListener('load', onLoad);
    img.addEventListener('error', onError);
    img.src = url;
  }

  async function fetchViaBlob(url) {
    el.imageFetchStatus.textContent = 'Fetching via CORS…';
    try {
      const res = await fetch(url, { mode: 'cors' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const obj = URL.createObjectURL(blob);
      el.imagePreview.src = obj;
      el.imageFetchStatus.textContent = 'Loaded (blob)';
      logAudit('image_preview', { url, ok: true, method: 'fetch', type: blob.type, size: blob.size });
    } catch (e) {
      el.imageFetchStatus.textContent = 'Cannot preview: CORS blocked or fetch failed.';
      logAudit('image_preview', { url, ok: false, method: 'fetch', error: e.message });
    }
  }

  // --- Admin panel
  function renderAdmin() {
    const allUsers = usersAll();
    const allNotes = notesAll();
    const allFiles = filesAll();
    el.adminUsersList.innerHTML = allUsers.map(u => `<li><span>${escapeHTML(u.email)}</span><span class="meta">${u.role} · ${u.createdAt}</span></li>`).join('');
    el.adminNotesList.innerHTML = allNotes.map(n => `<li><span>${escapeHTML(n.title||'(untitled)')}</span><span class="meta">owner:${ownerEmail(n.ownerId)} · ${n.updatedAt}</span></li>`).join('');
    el.adminFilesList.innerHTML = allFiles.map(f => `<li><span>${escapeHTML(f.name)}</span><span class="meta">owner:${ownerEmail(f.ownerId)} · ${f.type} · ${fmtBytes(f.size)}</span></li>`).join('');
  }
  function ownerEmail(uid) { return usersAll().find(u => u.id === uid)?.email || 'unknown'; }

  // --- UI helpers
  function hydrateUI() {
    renderAudit();
    const s = session();
    if (s) {
      el.userStatus.textContent = `Logged in as ${s.email} (${s.role})`;
      el.logoutBtn.classList.remove('hidden');
      el.authSection.classList.add('hidden');
      el.notesSection.classList.remove('hidden');
      el.filesSection.classList.remove('hidden');
      el.imageSection.classList.remove('hidden');
      if (isAdmin()) { el.adminSection.classList.remove('hidden'); renderAdmin(); } else { el.adminSection.classList.add('hidden'); }
      renderNotesList(); renderFiles();
    } else {
      el.userStatus.textContent = 'Not logged in';
      el.logoutBtn.classList.add('hidden');
      el.authSection.classList.remove('hidden');
      el.notesSection.classList.add('hidden');
      el.filesSection.classList.add('hidden');
      el.imageSection.classList.add('hidden');
      el.adminSection.classList.add('hidden');
    }
  }
  function msg(target, text, isErr=false) {
    target.textContent = text; target.style.color = isErr ? 'var(--warn)' : 'var(--muted)';
    setTimeout(() => { if (target.textContent === text) target.textContent = ''; }, 2000);
  }
  function escapeHTML(s='') { return s.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
  function escapeAttr(s='') { return s.replace(/["']/g, ''); }
  function fmtBytes(n=0) { return n < 1024 ? `${n} B` : n < 1024*1024 ? `${(n/1024).toFixed(1)} KB` : `${(n/1024/1024).toFixed(1)} MB`; }
  function shorten(s, n=200) { return s.length>n ? s.slice(0,n)+'…' : s; }

  // --- Event bindings
  function bindEvents() {
    el.registerForm.addEventListener('submit', (e) => { e.preventDefault(); register(el.regEmail.value, el.regPassword.value, el.regRole.value); });
    el.loginForm.addEventListener('submit', (e) => { e.preventDefault(); login(el.loginEmail.value, el.loginPassword.value); });
    el.logoutBtn.addEventListener('click', logout);

    el.noteSearchInput.addEventListener('input', renderNotesList);
    el.saveNoteBtn.addEventListener('click', saveCurrentNote);
    el.newNoteBtn.addEventListener('click', () => { selectedNoteId = null; el.noteTitleInput.value=''; el.noteContentEditable.innerHTML=''; msg(el.noteMsg, 'New note', false); });
    el.deleteNoteBtn.addEventListener('click', deleteCurrentNote);

    el.fileInput.addEventListener('change', () => { const f = el.fileInput.files?.[0]; handleFile(f); });

    el.previewImageBtn.addEventListener('click', () => {
      const url = (el.imageUrlInput.value||'').trim(); if (!url) { el.imageFetchStatus.textContent = 'Enter a URL'; return; }
      previewRemoteImage(url);
    });
  }

  // --- Init
  function init() {
    bindEvents();
    hydrateUI();
  }
  document.addEventListener('DOMContentLoaded', init);
})();