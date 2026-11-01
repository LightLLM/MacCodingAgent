import { formatUptime } from "@/lib/api";
import type { AgentHealth } from "@/lib/types";

export function StatusPill({ health }: { health: AgentHealth | null }) {
  if (!health) {
    return <span className="status-pill">Connecting…</span>;
  }

  return (
    <span className="status-pill" data-testid="status-pill">
      <span className="status-dot" aria-hidden />
      {health.status} · up {formatUptime(health.uptimeSeconds)}
    </span>
  );
}
