const BACKEND_BASE = "https://websocket-production-e339.up.railway.app";

const qs = (s) => document.querySelector(s);
const statusEl = qs('#status');
const tableBody = qs('#teachersTable');
const tokenInput = qs('#adminToken');
const teacherCount = qs('#teacherCount');

const setStatus = (msg, type = 'info') => {
  statusEl.className = `status ${type}`;
  statusEl.textContent = msg || '';
};

const requireToken = () => {
  const token = (tokenInput.value || '').trim();
  if (!token) {
    throw new Error('Podaj token administratora');
  }
  return token;
};

const teacherLink = (teacherId, token) => {
  const origin = window.location.origin;
  return `${origin}/?teacher=${encodeURIComponent(teacherId)}&t=${encodeURIComponent(token)}`;
};

const renderTeachers = (items) => {
  tableBody.innerHTML = '';
  const list = Array.isArray(items) ? items : [];
  teacherCount.textContent = `${list.length} nauczycieli`;

  list.forEach((t) => {
    const tr = document.createElement('tr');
    const link = teacherLink(t.teacher_id, t.token);
    tr.innerHTML = `
      <td>${t.name || ''}</td>
      <td>${t.email || ''}</td>
      <td class="token">${t.teacher_id}</td>
      <td class="token">${t.token}</td>
      <td><a target="_blank" href="${link}">Otwórz panel</a></td>
      <td>
        <div class="table-actions">
          <button class="btn-outline" data-copy="${link}">Kopiuj link</button>
        </div>
      </td>
    `;
    tableBody.appendChild(tr);
  });
};

const adminFetch = async (path, opts = {}) => {
  const token = requireToken();
  const headers = Object.assign(
    { 'Content-Type': 'application/json', 'x-admin-token': token },
    opts.headers || {}
  );
  const response = await fetch(`${BACKEND_BASE}${path}`, {
    method: opts.method || 'GET',
    headers,
    body: opts.body,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }
  return response.json();
};

const refreshTeachers = async () => {
  const json = await adminFetch('/api/admin/teachers');
  renderTeachers(json.items || []);
};

qs('#loadTeachers')?.addEventListener('click', async () => {
  try {
    setStatus('Ładuję listę nauczycieli...', 'info');
    await refreshTeachers();
    setStatus('Załadowano listę nauczycieli', 'success');
  } catch (error) {
    setStatus(error.message, 'error');
  }
});

qs('#addTeacher')?.addEventListener('click', async () => {
  const name = (qs('#teacherName')?.value || '').trim();
  const email = (qs('#teacherEmail')?.value || '').trim();
  if (!name) {
    setStatus('Podaj imię i nazwisko nauczyciela', 'error');
    return;
  }
  try {
    setStatus('Dodaję nauczyciela...', 'info');
    await adminFetch('/api/admin/teachers', {
      method: 'POST',
      body: JSON.stringify({ name, email: email || null }),
    });
    qs('#teacherName').value = '';
    qs('#teacherEmail').value = '';
    await refreshTeachers();
    setStatus('Nauczyciel dodany pomyślnie', 'success');
  } catch (error) {
    setStatus(error.message, 'error');
  }
});

qs('#uploadCsv')?.addEventListener('click', async () => {
  try {
    let csv = (qs('#csvText')?.value || '').trim();
    if (!csv) {
      const file = qs('#csvFile')?.files?.[0];
      if (!file) {
        setStatus('Wybierz plik CSV lub wklej dane', 'error');
        return;
      }
      csv = await file.text();
    }
    setStatus('Przetwarzam CSV...', 'info');
    await adminFetch('/api/admin/teachers/upload', {
      method: 'POST',
      body: JSON.stringify({ csv }),
    });
    qs('#csvText').value = '';
    qs('#csvFile').value = '';
    await refreshTeachers();
    setStatus('Wgrano nauczycieli z CSV', 'success');
  } catch (error) {
    setStatus(error.message, 'error');
  }
});

// Delegacja kopiowania linków
qs('#teachersTable')?.addEventListener('click', async (event) => {
  const target = event.target;
  if (target instanceof HTMLElement && target.dataset.copy) {
    try {
      await navigator.clipboard.writeText(target.dataset.copy);
      setStatus('Skopiowano link nauczyciela', 'success');
    } catch (error) {
      setStatus('Nie udało się skopiować linku', 'error');
    }
  }
});
