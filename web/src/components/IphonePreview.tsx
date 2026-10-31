"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  createSession,
  fetchHealth,
  fetchModels,
  fetchProjects,
  fetchSessions,
  formatUptime,
  sendChat,
} from "@/lib/api";
import type { AgentHealth, ModelInfo, ProjectInfo, Session } from "@/lib/types";

type Tab = "status" | "chat" | "models" | "projects";

export function IphonePreview() {
  const [tab, setTab] = useState<Tab>("status");
  const [health, setHealth] = useState<AgentHealth | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  const active = sessions.find((s) => s.id === activeId) ?? null;

  useEffect(() => {
    void (async () => {
      const [h, s, m, p] = await Promise.all([
        fetchHealth(),
        fetchSessions(),
        fetchModels(),
        fetchProjects(),
      ]);
      setHealth(h);
      setSessions(s.sessions);
      setActiveId(s.sessions[0]?.id ?? null);
      setModels(m.models);
      setProjects(p.projects);
    })().catch(() => undefined);

    const timer = setInterval(() => {
      void fetchHealth()
        .then(setHealth)
        .catch(() => undefined);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  async function onSend(event: FormEvent) {
    event.preventDefault();
    const content = draft.trim();
    if (!content) return;
    setBusy(true);
    try {
      let sessionId = activeId;
      if (!sessionId) {
        const created = await createSession(content.slice(0, 48));
        sessionId = created.session.id;
        setSessions((prev) => [created.session, ...prev]);
        setActiveId(sessionId);
      }
      const result = await sendChat(sessionId, content);
      setSessions((prev) =>
        prev.map((s) => (s.id === result.session.id ? result.session : s)),
      );
      setDraft("");
      setHealth(await fetchHealth());
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="iphone-stage">
      <div className="iphone-copy">
        <h1>iPhone app</h1>
        <p>
          Live preview of the Mac Coding Agent companion. Open the SwiftUI project
          in Xcode to run on a simulator or device.
        </p>
      </div>
      <div className="iphone-frame" data-testid="iphone-frame">
        <div className="iphone-notch" aria-hidden />
        <div className="iphone-screen">
          <header className="iphone-header">
            <strong>Mac Coding Agent</strong>
            <span>{tab}</span>
          </header>
          <div className="iphone-body">
            {tab === "status" && (
              <div className="iphone-status">
                <h2>Status</h2>
                <p>Daemon on your Mac · always on</p>
                <div className="iphone-metrics">
                  <div>
                    <span>Status</span>
                    <strong>{health?.status ?? "…"}</strong>
                  </div>
                  <div>
                    <span>Uptime</span>
                    <strong>
                      {health ? formatUptime(health.uptimeSeconds) : "…"}
                    </strong>
                  </div>
                  <div>
                    <span>Model</span>
                    <strong>{health?.activeModel ?? "…"}</strong>
                  </div>
                  <div>
                    <span>Sessions</span>
                    <strong>{health?.sessions ?? 0}</strong>
                  </div>
                </div>
              </div>
            )}

            {tab === "chat" && (
              <div className="iphone-chat">
                <div className="iphone-messages">
                  {(active?.messages ?? [])
                    .filter((m) => m.role !== "system")
                    .map((message) => (
                      <div
                        key={message.id}
                        className="iphone-bubble"
                        data-role={message.role}
                      >
                        {message.content}
                      </div>
                    ))}
                </div>
                <form onSubmit={onSend} className="iphone-composer">
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Coding task…"
                    aria-label="iPhone coding prompt"
                    data-testid="iphone-prompt"
                  />
                  <button type="submit" disabled={busy || !draft.trim()}>
                    Send
                  </button>
                </form>
              </div>
            )}

            {tab === "models" && (
              <ul className="iphone-list">
                {models.map((model) => (
                  <li key={model.id}>
                    <strong>{model.name}</strong>
                    <span>
                      {model.provider}
                      {health?.activeModel === model.id ? " · active" : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {tab === "projects" && (
              <ul className="iphone-list">
                {projects.map((project) => (
                  <li key={project.id}>
                    <strong>{project.name}</strong>
                    <span>
                      {project.language} · {project.path}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <nav className="iphone-tabs" aria-label="iPhone tabs">
            {(
              [
                ["status", "Status"],
                ["chat", "Chat"],
                ["models", "Models"],
                ["projects", "Projects"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                data-active={tab === id}
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
