let apps = [];
let editingIndex = null;
const API_BASE = '/api';

function checkAuth() {
    const token = sessionStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/api/admin/login.html';
        return false;
    }
    return true;
}

function logout() {
    if (confirm('Log out now?')) {
        sessionStorage.removeItem('adminToken');
        window.location.href = '/api/admin/login.html';
    }
}

async function loadApps() {
    if (!checkAuth()) return;

    try {
        showStatus('Loading data...', 'info');
        const token = sessionStorage.getItem('adminToken');

        const response = await fetch(`${API_BASE}/apps`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            sessionStorage.removeItem('adminToken');
            window.location.href = '/api/admin/login.html';
            return;
        }

        if (!response.ok) throw new Error('Failed to load data');

        const data = await response.json();
        apps = data.apps || [];
        renderApps();

        showStatus('Data loaded successfully!', 'success');
        setTimeout(hideStatus, 2000);
    } catch (err) {
        console.error(err);
        showStatus('Error loading data', 'error');
    }
}

function renderApps() {
    const appsList = document.getElementById('appsList');

    if (apps.length === 0) {
        appsList.innerHTML =
            '<div style="text-align:center;padding:40px;color:#64748b">No apps found</div>';
        return;
    }

    appsList.innerHTML = apps.map((app, i) => `
        <div class="app-card">
            <div class="app-header">
                <div class="app-info">
                    <h3>${app.name}</h3>
                    <p>${app.description}</p>
                </div>
                <div class="app-actions">
                    <button onclick="editApp(${i})">
                        <i class="fa-solid fa-pen-to-square"></i> Edit
                    </button>
                    <button onclick="deleteApp(${i})">
                        <i class="fa-solid fa-trash"></i> Delete
                    </button>
                </div>
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

function editApp(i) {
    editingIndex = i;
    const a = apps[i];

    inputId.value = a.id;
    inputName.value = a.name;
    inputDeveloper.value = a.developer;
    inputRepo.value = a.repo;
    inputThumbnail.value = a.thumbnail;
    inputIcon.value = a.icon;
    inputDescription.value = a.description;
    inputPlatforms.value = a.platforms.join(', ');
    inputLicense.value = a.license.name;
    inputOpensource.checked = a.license.opensource;

    document.getElementById('formContainer').classList.add('active');
    scrollTo(0, 0);
}

function deleteApp(i) {
    if (confirm('Delete this app?')) {
        apps.splice(i, 1);
        renderApps();
        showStatus('App deleted. Remember to save.', 'info');
    }
}

function saveApp() {
    const id = inputId.value.trim();
    const name = inputName.value.trim();
    const dev = inputDeveloper.value.trim();

    if (!id || !name || !dev) {
        showStatus('ID, Name, Developer required', 'error');
        return;
    }

    const data = {
        id,
        name,
        developer: dev,
        repo: inputRepo.value,
        thumbnail: inputThumbnail.value,
        icon: inputIcon.value,
        description: inputDescription.value,
        platforms: inputPlatforms.value.split(',').map(x => x.trim()).filter(Boolean),
        license: {
            name: inputLicense.value,
            opensource: inputOpensource.checked
        }
    };

    if (editingIndex !== null) apps[editingIndex] = data;
    else apps.push(data);

    closeForm();
    renderApps();
    showStatus('Local data updated. Save to server.', 'success');
}

async function saveToFile() {
    if (!checkAuth()) return;

    try {
        showStatus('Saving...', 'info');
        const token = sessionStorage.getItem('adminToken');

        const r = await fetch(`${API_BASE}/apps`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ apps })
        });

        if (r.status === 401) {
            sessionStorage.removeItem('adminToken');
            window.location.href = '/api/admin/login.html';
            return;
        }

        if (!r.ok) throw new Error();

        showStatus('<i class="fa-solid fa-check"></i> Saved successfully', 'success');
    } catch {
        showStatus('Save failed', 'error');
    }
}

function closeForm() {
    formContainer.classList.remove('active');
    clearForm();
}

function clearForm() {
    document.querySelectorAll('#formContainer input, textarea').forEach(el => {
        if (el.type === 'checkbox') el.checked = true;
        else el.value = '';
    });
}

function showStatus(msg, type) {
    statusMessage.innerHTML = msg;
    statusMessage.className = `status ${type} show`;
}

function hideStatus() {
    statusMessage.className = 'status';
    statusMessage.innerHTML = '';
}

if (checkAuth()) loadApps();

document.getElementById('year').textContent = new Date().getFullYear();
