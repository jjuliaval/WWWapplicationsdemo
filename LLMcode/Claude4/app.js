// SafeStore Application - Main JavaScript File

class SafeStore {
    constructor() {
        this.currentUser = null;
        this.currentNote = null;
        this.init();
    }

    init() {
        this.loadUser();
        this.bindEvents();
        this.updateUI();
        this.loadAuditLog();
    }

    // Authentication Methods
    loadUser() {
        const userData = localStorage.getItem('safestore_user');
        if (userData) {
            this.currentUser = JSON.parse(userData);
        }
    }

    register(email, password, isAdmin = false) {
        const users = this.getUsers();
        
        if (users.find(u => u.email === email)) {
            this.showMessage('User already exists', 'error');
            return false;
        }

        const user = {
            id: Date.now().toString(),
            email,
            password, // In real app, this would be hashed
            role: isAdmin ? 'admin' : 'user',
            createdAt: new Date().toISOString()
        };

        users.push(user);
        localStorage.setItem('safestore_users', JSON.stringify(users));
        
        this.logAction('User registered', { email, role: user.role });
        this.showMessage('Registration successful', 'success');
        return true;
    }

    login(email, password) {
        const users = this.getUsers();
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            this.currentUser = user;
            localStorage.setItem('safestore_user', JSON.stringify(user));
            this.logAction('User logged in', { email });
            this.showMessage('Login successful', 'success');
            this.updateUI();
            return true;
        }
        
        this.showMessage('Invalid credentials', 'error');
        return false;
    }

    logout() {
        this.logAction('User logged out', { email: this.currentUser.email });
        this.currentUser = null;
        localStorage.removeItem('safestore_user');
        this.updateUI();
        this.showMessage('Logged out successfully', 'success');
    }

    getUsers() {
        return JSON.parse(localStorage.getItem('safestore_users') || '[]');
    }

    // Notes Methods
    getNotes() {
        return JSON.parse(localStorage.getItem('safestore_notes') || '[]');
    }

    saveNote(title, content) {
        const notes = this.getNotes();
        
        if (this.currentNote) {
            // Edit existing note
            const index = notes.findIndex(n => n.id === this.currentNote.id);
            if (index !== -1) {
                notes[index] = { ...notes[index], title, content, updatedAt: new Date().toISOString() };
                this.logAction('Note updated', { title, noteId: this.currentNote.id });
            }
        } else {
            // Create new note
            const note = {
                id: Date.now().toString(),
                title,
                content,
                userId: this.currentUser.id,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            notes.push(note);
            this.logAction('Note created', { title, noteId: note.id });
        }
        
        localStorage.setItem('safestore_notes', JSON.stringify(notes));
        this.currentNote = null;
        this.renderNotes();
        this.hideNoteEditor();
        this.showMessage('Note saved successfully', 'success');
    }

    deleteNote(noteId) {
        const notes = this.getNotes();
        const noteIndex = notes.findIndex(n => n.id === noteId);
        
        if (noteIndex !== -1) {
            const note = notes[noteIndex];
            notes.splice(noteIndex, 1);
            localStorage.setItem('safestore_notes', JSON.stringify(notes));
            this.logAction('Note deleted', { title: note.title, noteId });
            this.renderNotes();
            this.showMessage('Note deleted', 'success');
        }
    }

    searchNotes(query) {
        const notes = this.getNotes();
        const userNotes = notes.filter(n => n.userId === this.currentUser.id);
        
        if (!query) return userNotes;
        
        return userNotes.filter(note => 
            note.title.toLowerCase().includes(query.toLowerCase()) ||
            note.content.toLowerCase().includes(query.toLowerCase())
        );
    }

    // File Methods
    getFiles() {
        return JSON.parse(localStorage.getItem('safestore_files') || '[]');
    }

    saveFileMetadata(file) {
        const files = this.getFiles();
        
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const fileData = {
                    id: Date.now().toString(),
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    userId: this.currentUser.id,
                    dataUrl: e.target.result,
                    uploadedAt: new Date().toISOString()
                };
                
                files.push(fileData);
                localStorage.setItem('safestore_files', JSON.stringify(files));
                this.logAction('File uploaded', { fileName: file.name, fileSize: file.size });
                resolve(fileData);
            };
            reader.readAsDataURL(file);
        });
    }

    downloadFile(fileId) {
        const files = this.getFiles();
        const file = files.find(f => f.id === fileId);
        
        if (file) {
            const link = document.createElement('a');
            link.href = file.dataUrl;
            link.download = file.name;
            link.click();
            this.logAction('File downloaded', { fileName: file.name, fileId });
        }
    }

    // Image Preview Methods
    async previewImage(url) {
        const statusEl = document.getElementById('image-status');
        const previewEl = document.getElementById('image-preview');
        
        statusEl.textContent = 'Loading image...';
        statusEl.className = 'status-message';
        previewEl.innerHTML = '';
        
        try {
            const response = await fetch(url, { mode: 'cors' });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const blob = await response.blob();
            
            if (!blob.type.startsWith('image/')) {
                throw new Error('URL does not point to an image');
            }
            
            const img = document.createElement('img');
            img.src = URL.createObjectURL(blob);
            img.onload = () => URL.revokeObjectURL(img.src);
            
            previewEl.appendChild(img);
            statusEl.textContent = 'Image loaded successfully';
            statusEl.className = 'status-message success';
            
            this.logAction('Image previewed', { url });
            
        } catch (error) {
            statusEl.textContent = `Error: ${error.message}`;
            statusEl.className = 'status-message error';
        }
    }

    // Admin Methods
    isAdmin() {
        return this.currentUser && this.currentUser.role === 'admin';
    }

    getAllNotes() {
        return this.getNotes();
    }

    getAllFiles() {
        return this.getFiles();
    }

    // Audit Log Methods
    logAction(action, details = {}) {
        const logs = JSON.parse(localStorage.getItem('safestore_audit') || '[]');
        
        const logEntry = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            action,
            user: this.currentUser ? this.currentUser.email : 'Anonymous',
            details
        };
        
        logs.unshift(logEntry); // Add to beginning
        
        // Keep only last 100 entries
        if (logs.length > 100) {
            logs.splice(100);
        }
        
        localStorage.setItem('safestore_audit', JSON.stringify(logs));
    }

    getAuditLog() {
        return JSON.parse(localStorage.getItem('safestore_audit') || '[]');
    }

    // UI Methods
    updateUI() {
        const authSection = document.getElementById('auth-section');
        const mainApp = document.getElementById('main-app');
        const userInfo = document.getElementById('user-info');
        const currentUserEl = document.getElementById('current-user');
        const adminTab = document.getElementById('admin-tab');

        if (this.currentUser) {
            authSection.classList.add('hidden');
            mainApp.classList.remove('hidden');
            userInfo.classList.remove('hidden');
            currentUserEl.textContent = `${this.currentUser.email} (${this.currentUser.role})`;
            
            if (this.isAdmin()) {
                adminTab.classList.remove('hidden');
            } else {
                adminTab.classList.add('hidden');
            }
            
            this.renderNotes();
            this.renderFiles();
            this.loadAuditLog();
        } else {
            authSection.classList.remove('hidden');
            mainApp.classList.add('hidden');
            userInfo.classList.add('hidden');
        }
    }

    renderNotes() {
        const notesList = document.getElementById('notes-list');
        const searchQuery = document.getElementById('search-input').value;
        const notes = this.searchNotes(searchQuery);
        
        notesList.innerHTML = '';
        
        notes.forEach(note => {
            const noteEl = document.createElement('div');
            noteEl.className = 'note-item';
            noteEl.innerHTML = `
                <div class="note-title">${this.escapeHtml(note.title)}</div>
                <div class="note-preview">${this.escapeHtml(note.content.substring(0, 100))}${note.content.length > 100 ? '...' : ''}</div>
                <div class="note-actions">
                    <button class="btn btn-primary" onclick="app.editNote('${note.id}')">Edit</button>
                    <button class="btn btn-danger" onclick="app.deleteNote('${note.id}')">Delete</button>
                </div>
            `;
            notesList.appendChild(noteEl);
        });
    }

    renderFiles() {
        const filesList = document.getElementById('files-list');
        const files = this.getFiles().filter(f => f.userId === this.currentUser.id);
        
        filesList.innerHTML = '';
        
        files.forEach(file => {
            const fileEl = document.createElement('div');
            fileEl.className = 'file-item';
            fileEl.innerHTML = `
                <div class="file-info">
                    <div class="file-name">${this.escapeHtml(file.name)}</div>
                    <div class="file-meta">${this.formatFileSize(file.size)} • ${new Date(file.uploadedAt).toLocaleDateString()}</div>
                </div>
                <button class="btn btn-primary" onclick="app.downloadFile('${file.id}')">Download</button>
            `;
            filesList.appendChild(fileEl);
        });
    }

    renderAdminContent(type) {
        const adminContent = document.getElementById('admin-content');
        
        if (!this.isAdmin()) {
            adminContent.innerHTML = '<p>Access denied. Admin role required.</p>';
            return;
        }
        
        let content = '';
        
        switch (type) {
            case 'users':
                const users = this.getUsers();
                content = '<div class="admin-list">';
                users.forEach(user => {
                    content += `
                        <div class="admin-item">
                            <strong>${this.escapeHtml(user.email)}</strong> (${user.role})
                            <br><small>Registered: ${new Date(user.createdAt).toLocaleDateString()}</small>
                        </div>
                    `;
                });
                content += '</div>';
                break;
                
            case 'notes':
                const allNotes = this.getAllNotes();
                content = '<div class="admin-list">';
                allNotes.forEach(note => {
                    const user = this.getUsers().find(u => u.id === note.userId);
                    content += `
                        <div class="admin-item">
                            <strong>${this.escapeHtml(note.title)}</strong>
                            <br><small>By: ${user ? user.email : 'Unknown'} • ${new Date(note.createdAt).toLocaleDateString()}</small>
                            <br>${this.escapeHtml(note.content.substring(0, 100))}${note.content.length > 100 ? '...' : ''}
                        </div>
                    `;
                });
                content += '</div>';
                break;
                
            case 'files':
                const allFiles = this.getAllFiles();
                content = '<div class="admin-list">';
                allFiles.forEach(file => {
                    const user = this.getUsers().find(u => u.id === file.userId);
                    content += `
                        <div class="admin-item">
                            <strong>${this.escapeHtml(file.name)}</strong>
                            <br><small>By: ${user ? user.email : 'Unknown'} • ${this.formatFileSize(file.size)} • ${new Date(file.uploadedAt).toLocaleDateString()}</small>
                        </div>
                    `;
                });
                content += '</div>';
                break;
        }
        
        adminContent.innerHTML = content;
    }

    loadAuditLog() {
        const auditLog = document.getElementById('audit-log');
        const logs = this.getAuditLog();
        
        auditLog.innerHTML = '';
        
        logs.forEach(log => {
            const logEl = document.createElement('div');
            logEl.className = 'audit-entry';
            logEl.innerHTML = `
                <div class="audit-timestamp">${new Date(log.timestamp).toLocaleString()}</div>
                <div class="audit-action">${this.escapeHtml(log.action)}</div>
                <div class="audit-details">User: ${this.escapeHtml(log.user)} ${Object.keys(log.details).length ? '• ' + JSON.stringify(log.details) : ''}</div>
            `;
            auditLog.appendChild(logEl);
        });
    }

    editNote(noteId) {
        const notes = this.getNotes();
        const note = notes.find(n => n.id === noteId);
        
        if (note) {
            this.currentNote = note;
            document.getElementById('note-title').value = note.title;
            document.getElementById('note-content').innerHTML = note.content;
            this.showNoteEditor();
        }
    }

    showNoteEditor() {
        document.getElementById('note-editor').classList.remove('hidden');
        document.getElementById('note-title').focus();
    }

    hideNoteEditor() {
        document.getElementById('note-editor').classList.add('hidden');
        document.getElementById('note-title').value = '';
        document.getElementById('note-content').innerHTML = '';
        this.currentNote = null;
    }

    showMessage(message, type) {
        const messageEl = document.getElementById('message');
        messageEl.textContent = message;
        messageEl.className = `message ${type}`;
        messageEl.classList.add('show');
        
        setTimeout(() => {
            messageEl.classList.remove('show');
        }, 3000);
    }

    // Utility Methods
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Event Binding
    bindEvents() {
        // Auth tabs
        document.getElementById('login-tab').addEventListener('click', () => {
            document.getElementById('login-form').classList.remove('hidden');
            document.getElementById('register-form').classList.add('hidden');
            document.getElementById('login-tab').classList.add('active');
            document.getElementById('register-tab').classList.remove('active');
        });

        document.getElementById('register-tab').addEventListener('click', () => {
            document.getElementById('register-form').classList.remove('hidden');
            document.getElementById('login-form').classList.add('hidden');
            document.getElementById('register-tab').classList.add('active');
            document.getElementById('login-tab').classList.remove('active');
        });

        // Auth forms
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            this.login(email, password);
        });

        document.getElementById('register-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const isAdmin = document.getElementById('admin-role').checked;
            
            if (this.register(email, password, isAdmin)) {
                // Switch to login tab
                document.getElementById('login-tab').click();
                document.getElementById('login-email').value = email;
            }
        });

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.logout();
        });

        // Navigation tabs
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetId = e.target.id.replace('-tab', '-section');
                
                // Update active tab
                document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                // Show target section
                document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
                document.getElementById(targetId).classList.remove('hidden');
                
                // Load admin content if admin tab
                if (targetId === 'admin-section') {
                    this.renderAdminContent('users');
                    document.getElementById('admin-users-tab').classList.add('active');
                    document.getElementById('admin-notes-tab').classList.remove('active');
                    document.getElementById('admin-files-tab').classList.remove('active');
                }
            });
        });

        // Notes
        document.getElementById('new-note-btn').addEventListener('click', () => {
            this.currentNote = null;
            this.showNoteEditor();
        });

        document.getElementById('save-note-btn').addEventListener('click', () => {
            const title = document.getElementById('note-title').value.trim();
            const content = document.getElementById('note-content').innerHTML.trim();
            
            if (title && content) {
                this.saveNote(title, content);
            } else {
                this.showMessage('Please enter both title and content', 'error');
            }
        });

        document.getElementById('cancel-edit-btn').addEventListener('click', () => {
            this.hideNoteEditor();
        });

        document.getElementById('search-input').addEventListener('input', () => {
            this.renderNotes();
        });

        // Files
        document.getElementById('file-input').addEventListener('change', async (e) => {
            const files = Array.from(e.target.files);
            
            for (const file of files) {
                await this.saveFileMetadata(file);
            }
            
            this.renderFiles();
            this.showMessage(`${files.length} file(s) uploaded successfully`, 'success');
            e.target.value = ''; // Reset input
        });

        // Image preview
        document.getElementById('preview-btn').addEventListener('click', () => {
            const url = document.getElementById('image-url').value.trim();
            if (url) {
                this.previewImage(url);
            } else {
                this.showMessage('Please enter an image URL', 'error');
            }
        });

        // Admin tabs
        document.getElementById('admin-users-tab').addEventListener('click', () => {
            this.renderAdminContent('users');
            document.querySelectorAll('.admin-tabs .tab-btn').forEach(b => b.classList.remove('active'));
            document.getElementById('admin-users-tab').classList.add('active');
        });

        document.getElementById('admin-notes-tab').addEventListener('click', () => {
            this.renderAdminContent('notes');
            document.querySelectorAll('.admin-tabs .tab-btn').forEach(b => b.classList.remove('active'));
            document.getElementById('admin-notes-tab').classList.add('active');
        });

        document.getElementById('admin-files-tab').addEventListener('click', () => {
            this.renderAdminContent('files');
            document.querySelectorAll('.admin-tabs .tab-btn').forEach(b => b.classList.remove('active'));
            document.getElementById('admin-files-tab').classList.add('active');
        });
    }
}

// Initialize the application
const app = new SafeStore();