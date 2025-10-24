const backendBase =
  typeof window !== "undefined" && window.location
    ? import.meta?.env?.VITE_APP_BACKEND_URL || "http://localhost:3002"
    : process.env.BACKEND_URL || "http://localhost:3002";

const qs = (selector) => document.querySelector(selector);
const statusEl = qs("#status");
const tableBody = qs("#teachersTable");
const tokenInput = qs("#adminToken");

const setStatus = (message, variant = "success") => {
  if (!statusEl) {
    return;
  }
  statusEl.className = variant === "error" ? "error" : "success";
  statusEl.textContent = message;
};

const teacherLink = (teacherId, token) => {
  const appOrigin = window.location.origin;
  return `${appOrigin}/?teacher=${encodeURIComponent(teacherId)}&t=${encodeURIComponent(
    token,
  )}`;
};

const renderTeachers = (items) => {
  if (!tableBody) {
    return;
  }
  tableBody.innerHTML = "";
  items.forEach((teacher) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${teacher.name || ""}</td>
      <td>${teacher.email || ""}</td>
      <td class="token">${teacher.teacher_id}</td>
      <td class="token">${teacher.token}</td>
      <td>
        <a target="_blank" href="${teacherLink(teacher.teacher_id, teacher.token)}">Otwórz panel nauczyciela</a>
        <button type="button" class="copy-link" data-link="${teacherLink(teacher.teacher_id, teacher.token)}">Kopiuj link</button>
      </td>
    `;
    tableBody.appendChild(tr);
  });
};

const requireAdminToken = () => {
  const token = tokenInput?.value.trim();
  if (!token) {
    throw new Error("Wprowadź token administratora");
  }
  return token;
};

const adminFetch = async (path, options = {}) => {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const token = requireAdminToken();
  headers["x-admin-token"] = token;
  const response = await fetch(`${backendBase}${path}`, { ...options, headers });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`HTTP ${response.status}: ${body}`);
  }
  return response.json();
};

qs("#loadTeachers")?.addEventListener("click", async () => {
  try {
    const json = await adminFetch("/api/admin/teachers");
    renderTeachers(json.items || []);
    setStatus("Załadowano listę nauczycieli", "success");
  } catch (error) {
    setStatus(error.message, "error");
  }
});

qs("#uploadCsv")?.addEventListener("click", async () => {
  try {
    let csv = qs("#csvText")?.value.trim();
    if (!csv) {
      const file = qs("#csvFile")?.files?.[0];
      if (!file) {
        throw new Error("Wybierz plik CSV lub wklej dane");
      }
      csv = await file.text();
    }
    const json = await adminFetch("/api/admin/teachers/upload", {
      method: "POST",
      body: JSON.stringify({ csv }),
    });
    const list = await adminFetch("/api/admin/teachers");
    renderTeachers(list.items || []);
    setStatus(`Wgrano ${json.items?.length || 0} nauczycieli`, "success");
  } catch (error) {
    setStatus(error.message, "error");
  }
});

tableBody?.addEventListener("click", async (event) => {
  const target = event.target instanceof HTMLElement ? event.target.closest("button.copy-link") : null;
  if (!target) {
    return;
  }
  event.preventDefault();
  const originalLabel = target.dataset.label || "Kopiuj link";
  const link = target.dataset.link;
  if (!link) {
    setStatus("Brak linku do skopiowania", "error");
    return;
  }
  try {
    await navigator.clipboard.writeText(link);
    target.textContent = "Skopiowano!";
    target.dataset.label = originalLabel;
    setStatus("Skopiowano link nauczyciela", "success");
    window.setTimeout(() => {
      target.textContent = originalLabel;
    }, 2000);
  } catch (error) {
    console.error("Clipboard error", error);
    setStatus("Nie udało się skopiować linku", "error");
  }
});
