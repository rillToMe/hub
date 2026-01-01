let apps = [];
let editingIndex = null;
const API_BASE = '/api';

// Check authentication
function checkAuth() {
    const token = sessionStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/admin/login.html';
        return false;
    }
    return true;
}

// Logout function
function logout() {
    // jadikan bahasa inggris
    if (confirm('Log out now?')) {
        sessionStorage.removeItem('adminToken');
        window.location.href = '/admin/login.html';
    }
}

// Load apps dari server
async function loadApps() {
    if (!checkAuth()) return;
    
    try {
        showStatus('Loading data...', 'info');
        const token = sessionStorage.getItem('adminToken');
        
        const response = await fetch(`${API_BASE}/apps`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.status === 401) {
            sessionStorage.removeItem('adminToken');
            window.location.href = '/admin/login.html';
            return;
        }
        
        if (!response.ok) throw new Error('Failed to load data');
        
        const data = await response.json();
        apps = data.apps || [];
        renderApps();
        showStatus('Data loaded successfully!', 'success');
        setTimeout(() => hideStatus(), 2000);
    } catch (error) {
        showStatus('Error loading data: ' + error.message, 'error');
        console.error('Load error:', error);
    }
}

// Render apps ke UI
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

// Show add form
function showAddForm() {
    editingIndex = null;
    document.getElementById('formTitle').textContent = 'Add New App';
    clearForm();
    document.getElementById('formContainer').classList.add('active');
}

// Edit app
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

// Delete app
function deleteApp(index) {
    if (confirm('Delete this app?')) {
        apps.splice(index, 1);
        renderApps();
        showStatus("App deleted! Don't forget to save.");
    }
}

// Save app (add or edit)
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

// Close form
function closeForm() {
    document.getElementById('formContainer').classList.remove('active');
    clearForm();
}

// Clear form
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

// Save langsung ke file JSON
async function saveToFile() {
    if (!checkAuth()) return;
    
    try {
        showStatus('Saving data...', 'info');
        const token = sessionStorage.getItem('adminToken');
        
        const response = await fetch(`${API_BASE}/apps`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ apps })
        });
        
        if (response.status === 401) {
            sessionStorage.removeItem('adminToken');
            window.location.href = '/admin/login.html';
            return;
        }
        
        if (!response.ok) throw new Error('Failed to save data');
        
        const result = await response.json();
        showStatus('<i class="fa-solid fa-circle-check"></i> Data saved successfully to file!', 'success');
        setTimeout(() => hideStatus(), 3000);
    } catch (error) {
        showStatus('Error saving data: ' + error.message, 'error');
        console.error('Save error:', error);
    }
}

function showStatus(message, type) {
    const statusEl = document.getElementById('statusMessage');
    
    // Ganti .textContent jadi .innerHTML biar ikon <i> bisa muncul
    statusEl.innerHTML = message; 
    
    statusEl.className = `status ${type} show`; // Pastikan ada class 'show' atau animasi lo
}

// Hide status message
function hideStatus() {
    const statusEl = document.getElementById('statusMessage');
    statusEl.className = 'status';
    // Opsional: kosongin isinya pas sembunyi
    setTimeout(() => { statusEl.innerHTML = ''; }, 3000); 
}

// Check auth dan load apps saat page load
if (checkAuth()) {
    loadApps();
}

//anu
document.getElementById("year").textContent =
  new Date().getFullYear();