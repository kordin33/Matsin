const backendBase = (typeof window !== 'undefined' && window.location) ?
  (import.meta?.env?.VITE_APP_BACKEND_URL || 'http://localhost:3005') :
  (process.env.BACKEND_URL || 'http://localhost:3005');

const qs = (s) => document.querySelector(s);
const statusEl = qs('#status');
const tableBody = qs('#teachersTable');
const tokenInput = qs('#adminToken');

const setStatus = (msg, type = 'info') => {
  statusEl.className = type === 'error' ? 'error' : 'success';
  statusEl.textContent = msg;
};

const teacherLink = (teacher_id, token) => {
  const appOrigin = window.location.origin;
  return `${appOrigin}/?teacher=${encodeURIComponent(teacher_id)}&t=${encodeURIComponent(token)}`;
};

const renderTeachers = (items) => {
  tableBody.innerHTML = '';
  for (const t of items) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${t.name || ''}</td>
      <td>${t.email || ''}</td>
      <td class="token">${t.teacher_id}</td>
      <td class="token">${t.token}</td>
      <td><a target="_blank" href="${teacherLink(t.teacher_id, t.token)}">Otwórz panel nauczyciela</a></td>
    `;
    tableBody.appendChild(tr);
  }
};

const adminFetch = async (path, opts = {}) => {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  const token = tokenInput.value.trim();
  if (!token) throw new Error('Wprowadź admin token');
  headers['x-admin-token'] = token;
  const resp = await fetch(`${backendBase}${path}`, { ...opts, headers });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`HTTP ${resp.status}: ${txt}`);
  }
  return resp.json();
};

qs('#loadTeachers').addEventListener('click', async () => {
  try {
    const json = await adminFetch('/api/admin/teachers');
    renderTeachers(json.items || []);
    setStatus('Załadowano listę nauczycieli', 'ok');
  } catch (e) {
    setStatus(e.message, 'error');
  }
});

qs('#uploadCsv').addEventListener('click', async () => {
  try {
    let csv = qs('#csvText').value.trim();
    if (!csv) {
      const file = qs('#csvFile').files[0];
      if (!file) throw new Error('Wybierz plik CSV lub wklej dane');
      csv = await file.text();
    }
    const json = await adminFetch('/api/admin/teachers/upload', {
      method: 'POST',
      body: JSON.stringify({ csv }),
    });
    const list = await adminFetch('/api/admin/teachers');
    renderTeachers(list.items || []);
    setStatus(`Wgrano ${json.items?.length || 0} nauczycieli`, 'ok');
  } catch (e) {
    setStatus(e.message, 'error');
  }
});

