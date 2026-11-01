(() => {
  const params = new URLSearchParams(window.location.search);
  const port = params.get("port") || "8787";
  const API = `http://127.0.0.1:${port}/api`;

  const els = {
    status: document.getElementById("statusPill"),
    sessions: document.getElementById("sessions"),
    messages: document.getElementById("messages"),
    models: document.getElementById("models"),
    aboutMeta: document.getElementById("aboutMeta"),
    prompt: document.getElementById("prompt"),
    composer: document.getElementById("composer"),
    newSession: document.getElementById("newSession"),
  };

  let sessions = [];
  let activeId = null;
  let health = null;

  async function request(path, init) {
    const res = await fetch(`${API}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...init,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Request failed (${res.status})`);
    }
    return res.json();
  }

  function formatUptime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h) return `${h}h ${m}m`;
    if (m) return `${m}m ${s}s`;
    return `${s}s`;
  }

  function activeSession() {
    return sessions.find((s) => s.id === activeId) || null;
  }

  function renderSessions() {
    if (!sessions.length) {
      els.sessions.innerHTML = `<li class="empty">No sessions yet</li>`;
      return;
    }
    els.sessions.innerHTML = sessions
      .map(
        (s) => `<li><button type="button" data-id="${s.id}" data-active="${
          s.id === activeId
        }"><strong>${escapeHtml(s.title)}</strong><span>${escapeHtml(
          s.modelId,
        )}</span></button></li>`,
      )
      .join("");
    els.sessions.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeId = btn.getAttribute("data-id");
        renderSessions();
        renderMessages();
      });
    });
  }

  function renderMessages() {
    const session = activeSession();
    const msgs = (session?.messages || []).filter((m) => m.role !== "system");
    if (!msgs.length) {
      els.messages.innerHTML =
        `<div class="empty">Ask Mac Coding Agent to scaffold, refactor, or debug on this Mac Mini.</div>`;
      return;
    }
    els.messages.innerHTML = msgs
      .map(
        (m) =>
          `<div class="bubble ${m.role}">${escapeHtml(m.content)}</div>`,
      )
      .join("");
    els.messages.scrollTop = els.messages.scrollHeight;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  async function refreshHealth() {
    try {
      health = await request("/health");
      els.status.textContent = `${health.status} · up ${formatUptime(
        health.uptimeSeconds,
      )}`;
      els.aboutMeta.textContent = JSON.stringify(health, null, 2);
    } catch {
      els.status.textContent = "Agent offline";
    }
  }

  async function refreshSessions() {
    const data = await request("/sessions");
    sessions = data.sessions || [];
    if (!activeId) activeId = sessions[0]?.id || null;
    renderSessions();
    renderMessages();
  }

  async function refreshModels() {
    const data = await request("/models");
    els.models.innerHTML = (data.models || [])
      .map(
        (m) => `<article class="card"><h3>${escapeHtml(m.name)}</h3><p>${escapeHtml(
          m.provider,
        )} · ${escapeHtml(m.description)}${
          m.id === data.activeModelId ? " · active" : ""
        }</p></article>`,
      )
      .join("");
  }

  async function createSession() {
    const { session } = await request("/sessions", {
      method: "POST",
      body: JSON.stringify({ title: "New coding session" }),
    });
    sessions.unshift(session);
    activeId = session.id;
    renderSessions();
    renderMessages();
  }

  els.composer.addEventListener("submit", async (event) => {
    event.preventDefault();
    const content = els.prompt.value.trim();
    if (!content) return;
    els.prompt.value = "";
    if (!activeId) await createSession();
    const result = await request(`/sessions/${activeId}/chat`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
    sessions = sessions.map((s) =>
      s.id === result.session.id ? result.session : s,
    );
    renderSessions();
    renderMessages();
    await refreshHealth();
  });

  els.newSession.addEventListener("click", () => {
    void createSession();
  });

  document.querySelectorAll("[data-view]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll("[data-view]")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const view = btn.getAttribute("data-view");
      document
        .querySelectorAll(".view")
        .forEach((section) => section.classList.add("hidden"));
      document.getElementById(`view-${view}`)?.classList.remove("hidden");
      if (view === "models") void refreshModels();
    });
  });

  if (window.macDesktop?.onNavigate) {
    window.macDesktop.onNavigate((target) => {
      document.querySelector(`[data-view="${target}"]`)?.click();
    });
  }

  void (async () => {
    await refreshHealth();
    await refreshSessions();
    await refreshModels();
    setInterval(() => void refreshHealth(), 3000);
  })();
})();
