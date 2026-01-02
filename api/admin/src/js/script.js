let apps = [];
let editingIndex = null;
const API_BASE = '/api';

// ================= AUTH =================
function checkAuth() {
  const token = sessionStorage.getItem('adminToken');
  if (!token) {
    window.location.href = '/admin/login.html';
    return false;
  }
  return true;
}

function logout() {
  if (confirm('Log out now?')) {
    sessionStorage.removeItem('adminToken');
    window.location.href = '/admin/login.html';
  }
}

// ================= LOAD FROM DATABASE =================
async function loadApps() {
  if (!checkAuth()) return;

  try {
    showStatus('Loading data from database...', 'info');
    const token = sessionStorage.getItem('adminToken');

    const res = await fetch(`${API_BASE}/apps`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (res.status === 401) {
      sessionStorage.removeItem('adminToken');
      window.location.href = '/admin/login.html';
      return;
    }

    if (!res.ok) throw new Error('Failed to load apps');

    const data = await res.json();
    apps = data.apps || [];
    renderApps();

    showStatus('Data loaded from database', 'success');
    setTimeout(hideStatus, 2000);
  } catch (err) {
    console.error(err);
    showStatus('Database load failed', 'error');
  }
}

// ================= RENDER =================
function renderApps() {
  const appsList = document.getElementById('appsList');

  if (apps.length === 0) {
    appsList.innerHTML = `
      <div style="text-align:center;padding:40px;color:#64748b;">
        No apps found. Add your first app.
      </div>
    `;
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
          <button onclick="editApp(${i})">Edit</button>
          <button onclick="deleteApp(${i})">Delete</button>
        </div>
      </div>
    </div>
  `).join('');
}

// ================= FORM =================
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
}

function deleteApp(index) {
  if (confirm('Delete this app?')) {
    apps.splice(index, 1);
    renderApps();
    showStatus('App removed. Save to apply changes.', 'info');
  }
}

function saveApp() {
  const id = inputId.value.trim();
  const name = inputName.value.trim();
  const developer = inputDeveloper.value.trim();

  if (!id || !name || !developer) {
    showStatus('ID, Name, and Developer are required', 'error');
    return;
  }

  const app = {
    id,
    name,
    developer,
    repo: inputRepo.value.trim(),
    thumbnail: inputThumbnail.value.trim(),
    icon: inputIcon.value.trim(),
    description: inputDescription.value.trim(),
    platforms: inputPlatforms.value.split(',').map(p => p.trim()).filter(Boolean),
    license: {
      name: inputLicense.value.trim(),
      opensource: inputOpensource.checked
    }
  };

  if (editingIndex !== null) {
    apps[editingIndex] = app;
  } else {
    apps.push(app);
  }

  closeForm();
  renderApps();
  showStatus('Local changes ready. Click save.', 'info');
}

// ================= SAVE TO DATABASE =================
async function saveToDatabase() {
  if (!checkAuth()) return;

  try {
    showStatus('Saving to database...', 'info');
    const token = sessionStorage.getItem('adminToken');

    const res = await fetch(`${API_BASE}/apps`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ apps })
    });

    if (res.status === 401) {
      sessionStorage.removeItem('adminToken');
      window.location.href = '/admin/login.html';
      return;
    }

    if (!res.ok) throw new Error('Save failed');

    showStatus('Saved to database successfully', 'success');
    setTimeout(hideStatus, 3000);
  } catch (err) {
    console.error(err);
    showStatus('Database save failed', 'error');
  }
}

// ================= UI HELPERS =================
function closeForm() {
  document.getElementById('formContainer').classList.remove('active');
  clearForm();
}

function clearForm() {
  document.querySelectorAll('#formContainer input, #formContainer textarea')
    .forEach(el => el.value = '');
  inputOpensource.checked = true;
}

function showStatus(msg, type) {
  const el = document.getElementById('statusMessage');
  el.innerHTML = msg;
  el.className = `status ${type} show`;
}

function hideStatus() {
  const el = document.getElementById('statusMessage');
  el.className = 'status';
  el.innerHTML = '';
}

// ================= INIT =================
if (checkAuth()) loadApps();

document.getElementById('year').textContent =
  new Date().getFullYear();
