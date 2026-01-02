let apps = [];
let isDataLoaded = false;
let editingIndex = null;
const API_BASE = '/api';
const ADMIN_BASE = '/admin';

const AuthStorage = {
    setToken(token, expiresIn = 3600000) {
        const expiry = Date.now() + expiresIn;
        localStorage.setItem('adminToken', token);
        localStorage.setItem('tokenExpiry', expiry.toString());
    },
    
    getToken() {
        const token = localStorage.getItem('adminToken');
        const expiry = localStorage.getItem('tokenExpiry');
        
        if (!token || !expiry) return null;
        
        if (Date.now() > parseInt(expiry)) {
            this.clearToken();
            return null;
        }
        
        return token;
    },
    
    clearToken() {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('tokenExpiry');
    },
    
    isTokenValid() {
        return this.getToken() !== null;
    }
};

function checkAuth() {
    if (!AuthStorage.isTokenValid()) {
        window.location.href = `${ADMIN_BASE}/login.html`;
        return false;
    }
    return true;
}

function logout() {
    if (confirm('Log out now?')) {
        AuthStorage.clearToken();
        window.location.href = `${ADMIN_BASE}/login.html`;
    }
}

async function loadApps() {
    if (!checkAuth()) return;
    
    try {
        showStatus('Loading data...', 'info');
        const token = AuthStorage.getToken();
        
        const response = await fetch(`${API_BASE}/apps`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.status === 401) {
            AuthStorage.clearToken();
            window.location.href = `${ADMIN_BASE}/login.html`;
            return;
        }
        
        if (!response.ok) throw new Error('Failed to load data');
        
        const data = await response.json();
        apps = data.apps || [];
        
        isDataLoaded = true; 
        
        renderApps();
        showStatus('Data loaded successfully!', 'success');
        setTimeout(() => hideStatus(), 2000);
    } catch (error) {
        showStatus('Error loading data: ' + error.message, 'error');
        console.error('Load error:', error);
    }
}

function renderApps() {
    const appsList = document.getElementById('appsList');
    if (apps.length === 0) {
        appsList.innerHTML = '<div style="text-align: center; padding: 40px; color: #64748b;">No apps found. Add your first app!</div>';
        return;
    }
    
    appsList.innerHTML = apps.map((app, index) => `
        <div class="app-card">
            <div class="app-header">
                <div class="app-info">
                    <h3>${app.name}</h3>
                    <p>${app.description}</p>
                </div>
                <div class="app-actions">
                    <button class="btn-edit" onclick="editApp(${index})">
                        <i class="fa-solid fa-pen-to-square"></i> Edit
                    </button>
                    <button class="btn-delete" onclick="deleteApp(${index})">
                        <i class="fa-solid fa-trash-can"></i> Delete
                    </button>
                </div>
            </div>
            <div class="app-details">
                <div class="detail-item"><span class="detail-label">ID:</span> ${app.id}</div>
                <div class="detail-item"><span class="detail-label">Developer:</span> ${app.developer}</div>
                <div class="detail-item"><span class="detail-label">Repo:</span> ${app.repo}</div>
                <div class="detail-item"><span class="detail-label">Platforms:</span> ${app.platforms.join(', ')}</div>
                <div class="detail-item"><span class="detail-label">License:</span> ${app.license.name}</div>
                <div class="detail-item"><span class="detail-label">Open Source:</span> ${app.license.opensource ? 'Yes' : 'No'}</div>
            </div>
        </div>
    `).join('');
}

function showAddForm() {
    editingIndex = null;
    document.getElementById('formTitle').textContent = 'Add New App';
    clearForm();
    document.getElementById('formContainer').classList.add('active');
}

function editApp(index) {
    editingIndex = index;
    const app = apps[index];
    document.getElementById('formTitle').textContent = 'Edit App';
    document.getElementById('inputId').value = app.id;
    document.getElementById('inputName').value = app.name;
    document.getElementById('inputDeveloper').value = app.developer;
    document.getElementById('inputRepo').value = app.repo;
    document.getElementById('inputThumbnail').value = app.thumbnail;
    document.getElementById('inputIcon').value = app.icon;
    document.getElementById('inputDescription').value = app.description;
    document.getElementById('inputPlatforms').value = app.platforms.join(', ');
    document.getElementById('inputLicense').value = app.license.name;
    document.getElementById('inputOpensource').checked = app.license.opensource;
    document.getElementById('formContainer').classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteApp(index) {
    if (confirm('Delete this app?')) {
        apps.splice(index, 1);
        renderApps();
        showStatus("App deleted! Don't forget to save.");
    }
}

function saveApp() {
    const id = document.getElementById('inputId').value.trim();
    const name = document.getElementById('inputName').value.trim();
    const developer = document.getElementById('inputDeveloper').value.trim();
    
    if (!id || !name || !developer) {
        showStatus('ID, Name, and Developer are required!', 'error');
        return;
    }
    
    const newApp = {
        id: id,
        name: name,
        developer: developer,
        repo: document.getElementById('inputRepo').value.trim(),
        thumbnail: document.getElementById('inputThumbnail').value.trim(),
        icon: document.getElementById('inputIcon').value.trim(),
        description: document.getElementById('inputDescription').value.trim(),
        platforms: document.getElementById('inputPlatforms').value.split(',').map(p => p.trim()).filter(p => p),
        license: {
            name: document.getElementById('inputLicense').value.trim(),
            opensource: document.getElementById('inputOpensource').checked
        }
    };

    if (editingIndex !== null) {
        apps[editingIndex] = newApp;
        showStatus('App updated! Don\'t forget to save.', 'success');
    } else {
        apps.push(newApp);
        showStatus('App added! Don\'t forget to save.', 'success');
    }

    closeForm();
    renderApps();
    setTimeout(() => hideStatus(), 3000);
}

function closeForm() {
    document.getElementById('formContainer').classList.remove('active');
    clearForm();
}

function clearForm() {
    document.getElementById('inputId').value = '';
    document.getElementById('inputName').value = '';
    document.getElementById('inputDeveloper').value = '';
    document.getElementById('inputRepo').value = '';
    document.getElementById('inputThumbnail').value = '';
    document.getElementById('inputIcon').value = '';
    document.getElementById('inputDescription').value = '';
    document.getElementById('inputPlatforms').value = '';
    document.getElementById('inputLicense').value = '';
    document.getElementById('inputOpensource').checked = true;
}

async function saveToFile() {
    if (!checkAuth()) return;

    if (!isDataLoaded) {
        showStatus('Wait! Data is still loading from database. Please wait a moment.', 'error');
        return;
    }

    try {
        showStatus('Saving to database...', 'info');
        const token = AuthStorage.getToken();

        const response = await fetch(`${API_BASE}/apps`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ apps }) 
        });

        if (response.status === 401) {
            AuthStorage.clearToken();
            window.location.href = `${ADMIN_BASE}/login.html`;
            return;
        }

        if (!response.ok) throw new Error('Failed to save data');

        showStatus(
          '<i class="fa-solid fa-circle-check"></i> Saved to database successfully',
          'success'
        );
        setTimeout(() => hideStatus(), 3000);

    } catch (error) {
        console.error(error);
        showStatus('Database save failed: ' + error.message, 'error');
    }
}

function showStatus(message, type) {
    const statusEl = document.getElementById('statusMessage');
    statusEl.innerHTML = message; 
    statusEl.className = `status ${type} show`; 
}

function hideStatus() {
    const statusEl = document.getElementById('statusMessage');
    statusEl.className = 'status';
    setTimeout(() => { statusEl.innerHTML = ''; }, 3000); 
}

if (checkAuth()) {
    loadApps();
}

document.getElementById("year").textContent = new Date().getFullYear();
