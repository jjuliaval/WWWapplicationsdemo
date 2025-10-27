// SafeStore - Client-side Secure Storage Application

// Storage keys
const STORAGE_KEYS = {
    USERS: 'safestore_users',
    NOTES: 'safestore_notes',
    FILES: 'safestore_files',
    AUDIT_LOG: 'safestore_audit_log',
    SESSION: 'safestore_session'
};

// Application state
let currentUser = null;
let currentNoteId = null;
let notes = [];
let files = [];
let auditLog = [];

// DOM Elements
const elements = {
    authSection: document.getElementById('auth-section'),
    appSection: document.getElementById('app-section'),
    loginForm: document.getElementById('login-form'),
    registerForm: document.getElementById('register-form'),
    userEmail: document.getElementById('user-email'),
    userRole: document.getElementById('user-role'),
    logoutBtn: document.getElementById('logout-btn'),
    notesList: document.getElementById('notes-list'),
    noteEditor: document.getElementById('note-editor'),
    noteTitle: document.getElementById('note-title'),
    noteContent: document.getElementById('note-content'),
    filesList: document.getElementById('files-list'),
    auditLogContainer: document.getElementById('audit-log'),
    usersList: document.getElementById('users-list'),
    allNotesList: document.getElementById('all-notes-list'),
    allFilesList: document.getElementById('all-files-list'),
    searchInput: document.getElementById('search-input'),
    imagePreview: document.getElementById('image-preview'),
    previewStatus: document.getElementById('preview-status')
};

// Initialize application
function initApp() {
    loadData();
    checkSession();
    setupEventListeners();
    addAuditLog('Application initialized', 'info');
}

// Load data from localStorage
function loadData() {
    notes = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTES) || '[]');
    files = JSON.parse(localStorage.getItem(STORAGE_KEYS.FILES) || '[]');
    auditLog = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOG) || '[]');
}

// Save data to localStorage
function saveData() {
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
    localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(files));
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOG, JSON.stringify(auditLog));
}

// Check if user has active session
function checkSession() {
    const session = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSION) || 'null');
    if (session && session.expires > Date.now()) {
        currentUser = session.user;
        showApp();
    } else {
        showAuth();
        localStorage.removeItem(STORAGE_KEYS.SESSION);
    }
}

// Show authentication section
function showAuth() {
    elements.authSection.style.display = 'block';
    elements.appSection.style.display = 'none';
}

// Show main application section
function showApp() {
    elements.authSection.style.display = 'none';
    elements.appSection.style.display = 'block';
    
    elements.userEmail.textContent = currentUser.email;
    elements.userRole.textContent = `(${currentUser.role})`;
    
    // Show admin tab if user is admin
    const adminTab = document.querySelector('.admin-only');
    if (adminTab) {
        adminTab.style.display = currentUser.role === 'admin' ? 'block' : 'none';
    }
    
    renderNotes();
    renderFiles();
    renderAuditLog();
    
    if (currentUser.role === 'admin') {
        renderAdminPanel();
    }
}

// Setup event listeners
function setupEventListeners() {
    // Auth forms
    document.getElementById('login').addEventListener('submit', handleLogin);
    document.getElementById('register').addEventListener('submit', handleRegister);
    document.getElementById('show-register').addEventListener('click', showRegisterForm);
    document.getElementById('show-login').addEventListener('click', showLoginForm);
    
    // Navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', handleTabChange);
    });
    
    // Notes
    document.getElementById('new-note-btn').addEventListener('click', createNewNote);
    document.getElementById('save-note').addEventListener('click', saveNote);
    document.getElementById('cancel-edit').addEventListener('click', cancelEdit);
    
    // Files
    document.getElementById('upload-btn').addEventListener('click', handleFileUpload);
    
    // Remote images
    document.getElementById('preview-btn').addEventListener('click', previewRemoteImage);
    
    // Search
    elements.searchInput.addEventListener('input', handleSearch);
    
    // Logout
    elements.logoutBtn.addEventListener('click', handleLogout);
}

// Auth handlers
function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        // Create session
        currentUser = { email: user.email, role: user.role };
        const session = {
            user: currentUser,
            expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        };
        
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
        showApp();
        addAuditLog('User logged in', 'success', { email });
    } else {
        alert('Invalid email or password');
        addAuditLog('Failed login attempt', 'error', { email });
    }
}

function handleRegister(e) {
    e.preventDefault();
    
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const isAdmin = document.getElementById('register-admin').checked;
    
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    
    if (users.some(u => u.email === email)) {
        alert('Email already registered');
        return;
    }
    
    const newUser = {
        email,
        password,
        role: isAdmin ? 'admin' : 'user',
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    
    // Auto-login after registration
    currentUser = { email: newUser.email, role: newUser.role };
    const session = {
        user: currentUser,
        expires: Date.now() + (24 * 60 * 60 * 1000)
    };
    
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
    showApp();
    addAuditLog('New user registered', 'success', { email, role: newUser.role });
}

function showRegisterForm(e) {
    e.preventDefault();
    elements.loginForm.style.display = 'none';
    elements.registerForm.style.display = 'block';
}

function showLoginForm(e) {
    e.preventDefault();
    elements.registerForm.style.display = 'none';
    elements.loginForm.style.display = 'block';
}

function handleLogout() {
    addAuditLog('User logged out', 'info', { email: currentUser.email });
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    currentUser = null;
    showAuth();
}

// Tab navigation
function handleTabChange(e) {
    const tabName = e.target.dataset.tab;
    
    // Update active tab
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    
    // Show corresponding content
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Refresh admin panel if needed
    if (tabName === 'admin' && currentUser.role === 'admin') {
        renderAdminPanel();
    }
}

// Notes functionality
function renderNotes() {
    const filteredNotes = searchNotes(notes.filter(note => note.owner === currentUser.email));
    
    if (filteredNotes.length === 0) {
        elements.notesList.innerHTML = '<p>No notes found. Create your first note!</p>';
        return;
    }
    
    elements.notesList.innerHTML = filteredNotes.map(note => `
        <div class="note-item" data-note-id="${note.id}">
            <h4>${escapeHtml(note.title)}</h4>
            <p>${escapeHtml(note.content.substring(0, 100))}...</p>
            <small>Last updated: ${new Date(note.updatedAt).toLocaleString()}</small>
        </div>
    `).join('');
    
    // Add click listeners to note items
    elements.notesList.querySelectorAll('.note-item').forEach(item => {
        item.addEventListener('click', () => editNote(item.dataset.noteId));
    });
}

function createNewNote() {
    currentNoteId = null;
    elements.noteTitle.value = '';
    elements.noteContent.innerHTML = '';
    elements.noteEditor.style.display = 'block';
    document.getElementById('editor-title').textContent = 'New Note';
}

function editNote(noteId) {
    const note = notes.find(n => n.id === noteId);
    if (note && note.owner === currentUser.email) {
        currentNoteId = noteId;
        elements.noteTitle.value = note.title;
        elements.noteContent.innerHTML = note.content;
        elements.noteEditor.style.display = 'block';
        document.getElementById('editor-title').textContent = 'Edit Note';
    }
}

function saveNote() {
    const title = elements.noteTitle.value.trim();
    const content = elements.noteContent.innerHTML.trim();
    
    if (!title) {
        alert('Please enter a title');
        return;
    }
    
    const now = new Date().toISOString();
    
    if (currentNoteId) {
        // Update existing note
        const noteIndex = notes.findIndex(n => n.id === currentNoteId);
        if (noteIndex !== -1) {
            notes[noteIndex] = {
                ...notes[noteIndex],
                title,
                content,
                updatedAt: now
            };
            addAuditLog('Note updated', 'success', { noteId: currentNoteId, title });
        }
    } else {
        // Create new note
        const newNote = {
            id: generateId(),
            title,
            content,
            owner: currentUser.email,
            createdAt: now,
            updatedAt: now
        };
        notes.push(newNote);
        addAuditLog('Note created', 'success', { noteId: newNote.id, title });
    }
    
    saveData();
    cancelEdit();
    renderNotes();
}

function cancelEdit() {
    elements.noteEditor.style.display = 'none';
    currentNoteId = null;
}

function searchNotes(notesList) {
    const searchTerm = elements.searchInput.value.toLowerCase();
    if (!searchTerm) return notesList;
    
    return notesList.filter(note => 
        note.title.toLowerCase().includes(searchTerm) ||
        note.content.toLowerCase().includes(searchTerm)
    );
}

function handleSearch() {
    renderNotes();
}

// Files functionality
function renderFiles() {
    const userFiles = files.filter(file => file.owner === currentUser.email);
    
    if (userFiles.length === 0) {
        elements.filesList.innerHTML = '<p>No files uploaded yet.</p>';
        return;
    }
    
    elements.filesList.innerHTML = userFiles.map(file => `
        <div class="file-item">
            <h4>${escapeHtml(file.name)}</h4>
            <p>Size: ${formatFileSize(file.size)} • Type: ${file.type}</p>
            <p>Uploaded: ${new Date(file.uploadedAt).toLocaleString()}</p>
            <a href="${file.dataUrl}" class="download-btn" download="${file.name}">Download</a>
        </div>
    `).join('');
}

function handleFileUpload() {
    const fileInput = document.getElementById('file-input');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Please select a file');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const newFile = {
            id: generateId(),
            name: file.name,
            type: file.type,
            size: file.size,
            dataUrl: e.target.result,
            owner: currentUser.email,
            uploadedAt: new Date().toISOString()
        };
        
        files.push(newFile);
        saveData();
        renderFiles();
        addAuditLog('File uploaded', 'success', { fileName: file.name, size: file.size });
        
        // Clear file input
        fileInput.value = '';
    };
    
    reader.readAsDataURL(file);
}

// Remote image preview
async function previewRemoteImage() {
    const imageUrl = document.getElementById('image-url').value.trim();
    
    if (!imageUrl) {
        alert('Please enter an image URL');
        return;
    }
    
    elements.previewStatus.textContent = 'Loading...';
    elements.previewStatus.className = 'status-loading';
    elements.imagePreview.innerHTML = '';
    
    try {
        elements.previewStatus.textContent = 'Loading image...';
        elements.previewStatus.className = 'status-loading';
        elements.imagePreview.innerHTML = '';
        
        // Simple and direct approach using Image object with crossOrigin
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = function() {
                elements.imagePreview.innerHTML = '';
                elements.imagePreview.appendChild(img);
                elements.previewStatus.textContent = 'Image loaded successfully';
                elements.previewStatus.className = 'status-success';
                addAuditLog('Remote image preview', 'success', { imageUrl });
                resolve();
            };
            
            img.onerror = function() {
                // Try without crossOrigin for some servers
                const img2 = new Image();
                img2.onload = function() {
                    elements.imagePreview.innerHTML = '';
                    elements.imagePreview.appendChild(img2);
                    elements.previewStatus.textContent = 'Image loaded (fallback method)';
                    elements.previewStatus.className = 'status-success';
                    addAuditLog('Remote image preview (fallback)', 'success', { imageUrl });
                    resolve();
                };
                img2.onerror = function() {
                    elements.previewStatus.textContent = 'Failed to load image. This may be due to CORS restrictions.';
                    elements.previewStatus.className = 'status-error';
                    elements.imagePreview.innerHTML = '<p>⚠️ CORS限制: 无法直接加载外部图片</p><p>请尝试使用本地服务器运行应用：</p><code>python3 -m http.server 8001</code>';
                    addAuditLog('Remote image preview failed', 'error', { 
                        imageUrl, 
                        error: 'CORS restriction - Use local server' 
                    });
                    reject(new Error('CORS restriction'));
                };
                img2.src = imageUrl;
                img2.style.maxWidth = '100%';
                img2.style.maxHeight = '400px';
            };
            
            // First try with crossOrigin attribute
            img.crossOrigin = 'anonymous';
            img.src = imageUrl;
            img.style.maxWidth = '100%';
            img.style.maxHeight = '400px';
            
            // Set timeout
            setTimeout(() => {
                if (!img.complete) {
                    img.onerror(new Event('timeout'));
                }
            }, 10000);
        });
        
    } catch (error) {
        elements.previewStatus.textContent = `Error: ${error.message}`;
        elements.previewStatus.className = 'status-error';
        elements.imagePreview.innerHTML = '<p>无法加载图片。请确保：</p><ul><li>URL是正确的图片链接</li><li>图片服务器允许跨域访问</li><li>或通过本地服务器运行应用</li></ul>';
        addAuditLog('Remote image preview failed', 'error', { imageUrl, error: error.message });
    }
}

// Admin panel
function renderAdminPanel() {
    if (currentUser.role !== 'admin') return;
    
    // Users list
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    elements.usersList.innerHTML = users.map(user => `
        <div class="admin-item">
            <strong>${escapeHtml(user.email)}</strong> (${user.role})
            <br><small>Created: ${new Date(user.createdAt).toLocaleString()}</small>
        </div>
    `).join('');
    
    // All notes
    elements.allNotesList.innerHTML = notes.map(note => `
        <div class="admin-item">
            <strong>${escapeHtml(note.title)}</strong> by ${note.owner}
            <br><small>Last updated: ${new Date(note.updatedAt).toLocaleString()}</small>
        </div>
    `).join('');
    
    // All files
    elements.allFilesList.innerHTML = files.map(file => `
        <div class="admin-item">
            <strong>${escapeHtml(file.name)}</strong> by ${file.owner}
            <br><small>Size: ${formatFileSize(file.size)} • Uploaded: ${new Date(file.uploadedAt).toLocaleString()}</small>
        </div>
    `).join('');
}

// Audit log
function renderAuditLog() {
    if (auditLog.length === 0) {
        elements.auditLogContainer.innerHTML = '<p>No audit entries yet.</p>';
        return;
    }
    
    // Show latest 20 entries
    const recentLogs = auditLog.slice(-20).reverse();
    
    elements.auditLogContainer.innerHTML = recentLogs.map(entry => `
        <div class="log-entry ${entry.type}">
            <div class="log-time">${new Date(entry.timestamp).toLocaleString()}</div>
            <div class="log-message">${escapeHtml(entry.message)}</div>
            ${entry.details ? `<div class="log-details">${escapeHtml(JSON.stringify(entry.details, null, 2))}</div>` : ''}
        </div>
    `).join('');
}

function addAuditLog(message, type = 'info', details = null) {
    const entry = {
        timestamp: new Date().toISOString(),
        message,
        type,
        details
    };
    
    auditLog.push(entry);
    saveData();
    
    // Only update UI if we're on the audit log tab
    if (elements.auditLogContainer.parentElement.classList.contains('active')) {
        renderAuditLog();
    }
}

// Utility functions
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);