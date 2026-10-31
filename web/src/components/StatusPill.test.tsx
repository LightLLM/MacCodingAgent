import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusPill } from "./StatusPill";
import type { AgentHealth } from "@/lib/types";

const health: AgentHealth = {
  name: "Mac Coding Agent",
  version: "1.0.0",
  status: "running",
  uptimeSeconds: 125,
  startedAt: new Date().toISOString(),
  modelProvider: "stub",
  activeModel: "stub-coder",
  sessions: 1,
  tasksQueued: 0,
  tasksRunning: 0,
  localModelsReachable: false,
};

describe("StatusPill", () => {
  it("shows connecting state without health", () => {
    render(<StatusPill health={null} />);
    expect(screen.getByText(/Connecting/i)).toBeInTheDocument();
  });

  it("shows running uptime", () => {
    render(<StatusPill health={health} />);
    expect(screen.getByTestId("status-pill")).toHaveTextContent("running");
    expect(screen.getByTestId("status-pill")).toHaveTextContent("2m 5s");
  });
});
