"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  createSession,
  fetchHealth,
  fetchSessions,
  formatUptime,
  sendChat,
} from "@/lib/api";
import type { AgentHealth, Session } from "@/lib/types";
import { StatusPill } from "./StatusPill";

export function AgentDashboard() {
  const [health, setHealth] = useState<AgentHealth | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const active = sessions.find((s) => s.id === activeId) ?? null;

  const refresh = useCallback(async () => {
    try {
      const [h, s] = await Promise.all([fetchHealth(), fetchSessions()]);
      setHealth(h);
      setSessions(s.sessions);
      setActiveId((current) => current ?? s.sessions[0]?.id ?? null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reach agent");
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => {
      void fetchHealth()
        .then(setHealth)
        .catch(() => undefined);
    }, 3000);
    return () => clearInterval(timer);
  }, [refresh]);

  async function onNewSession() {
    setBusy(true);
    try {
      const { session } = await createSession("New coding session");
      setSessions((prev) => [session, ...prev]);
      setActiveId(session.id);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create session");
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(event: FormEvent) {
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
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chat failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="dashboard">
      <div className="dash-header">
        <div>
          <h1>Agent</h1>
          <p>
            24/7 daemon for Mac Coding Agent
            {health ? ` · model ${health.activeModel}` : ""}
          </p>
        </div>
        <StatusPill health={health} />
      </div>

      {error ? (
        <div className="error-banner" role="alert">
          {error}
        </div>
      ) : null}

      <div className="metrics" data-testid="metrics">
        <div className="metric">
          <span>Uptime</span>
          <strong>{health ? formatUptime(health.uptimeSeconds) : "—"}</strong>
        </div>
        <div className="metric">
          <span>Sessions</span>
          <strong>{health?.sessions ?? sessions.length}</strong>
        </div>
        <div className="metric">
          <span>Tasks running</span>
          <strong>{health?.tasksRunning ?? 0}</strong>
        </div>
        <div className="metric">
          <span>Local models</span>
          <strong>
            {health?.localModelsReachable ? "Reachable" : "Stub"}
          </strong>
        </div>
      </div>

      <div className="workspace">
        <aside className="side-panel">
          <header>
            <h2>Sessions</h2>
            <button
              type="button"
              className="btn btn-solid"
              onClick={() => void onNewSession()}
              disabled={busy}
            >
              New
            </button>
          </header>
          <ul className="session-list">
            {sessions.length === 0 ? (
              <li className="empty">No sessions yet — start one to code.</li>
            ) : (
              sessions.map((session) => (
                <li key={session.id}>
                  <button
                    type="button"
                    data-active={session.id === activeId}
                    onClick={() => setActiveId(session.id)}
                  >
                    <strong>{session.title}</strong>
                    <span>{session.modelId}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </aside>

        <section className="chat-panel" aria-label="Coding chat">
          <header>
            <h2>{active?.title ?? "Coding chat"}</h2>
          </header>
          <div className="messages" data-testid="messages">
            {(active?.messages ?? []).filter((m) => m.role !== "system").length ===
            0 ? (
              <div className="empty">
                Ask Mac Coding Agent to scaffold, refactor, or debug — it keeps
                running while you sleep.
              </div>
            ) : (
              active?.messages
                .filter((m) => m.role !== "system")
                .map((message) => (
                  <div
                    key={message.id}
                    className="message"
                    data-role={message.role}
                  >
                    {message.content}
                  </div>
                ))
            )}
          </div>
          <form className="composer" onSubmit={onSubmit}>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Describe the coding task…"
              aria-label="Coding prompt"
              data-testid="prompt-input"
            />
            <button
              className="btn btn-solid"
              type="submit"
              disabled={busy || !draft.trim()}
              data-testid="send-prompt"
            >
              {busy ? "Working…" : "Send"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
