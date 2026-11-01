const http = require("node:http");
const { createHmac, randomBytes } = require("node:crypto");
const { URL } = require("node:url");

function id(n = 10) {
  return randomBytes(n).toString("hex").slice(0, n);
}

function stubComplete(prompt) {
  const trimmed = String(prompt || "").trim();
  const lower = trimmed.toLowerCase();
  if (!trimmed) {
    return "Mac Coding Agent is online on your Mac Mini. Describe what you want to build.";
  }
  if (lower.includes("hello") || lower.startsWith("hi")) {
    return "Hello from Mac Coding Agent on macOS. Ask me to scaffold, refactor, or debug using your local/open-source models.";
  }
  if (lower.includes("react") || lower.includes("component")) {
    return [
      "React starter:",
      "",
      "```tsx",
      "export function FeaturePanel({ title, children }: { title: string; children: React.ReactNode }) {",
      "  return (",
      '    <section className="feature-panel">',
      "      <h2>{title}</h2>",
      "      <div>{children}</div>",
      "    </section>",
      "  );",
      "}",
      "```",
    ].join("\n");
  }
  return [
    "Mac Coding Agent received:",
    "",
    `> ${trimmed.slice(0, 280)}`,
    "",
    "Plan:",
    "1. Clarify files and acceptance criteria",
    "2. Draft the minimal change",
    "3. Add tests",
    "4. Run locally on this Mac",
    "",
    "Tip: install Ollama for richer local model replies.",
  ].join("\n");
}

function createState() {
  const startedAt = new Date();
  return {
    startedAt,
    activeModelId: "stub-coder",
    sessions: [],
    tasks: [],
    models: [
      {
        id: "stub-coder",
        name: "Mac Coding Stub",
        provider: "stub",
        available: true,
        description: "Built-in local stub (works offline on Mac Mini)",
      },
      {
        id: "stub-fast",
        name: "Mac Coding Stub Fast",
        provider: "stub",
        available: true,
        description: "Faster stub responses",
      },
    ],
    projects: [
      {
        id: "local",
        name: "Mac Mini Workspace",
        path: "~/Developer",
        language: "TypeScript",
        lastOpenedAt: new Date().toISOString(),
      },
    ],
  };
}

function health(state) {
  return {
    name: "Mac Coding Agent",
    version: "1.0.0",
    status: "running",
    uptimeSeconds: Math.floor((Date.now() - state.startedAt.getTime()) / 1000),
    startedAt: state.startedAt.toISOString(),
    modelProvider: "stub",
    activeModel: state.activeModelId,
    sessions: state.sessions.length,
    tasksQueued: 0,
    tasksRunning: 0,
    localModelsReachable: true,
    desktop: true,
    platform: process.platform,
  };
}

function send(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  });
  res.end(payload);
}

async function readJson(req, limitBytes = 1_000_000) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limitBytes) {
      const err = new Error("Payload too large");
      err.statusCode = 413;
      throw err;
    }
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    const err = new Error("Invalid JSON body");
    err.statusCode = 400;
    throw err;
  }
}

function createServer(port = 8787) {
  const state = createState();

  const server = http.createServer(async (req, res) => {
    if (req.method === "OPTIONS") {
      send(res, 204, {});
      return;
    }

    const url = new URL(req.url || "/", `http://127.0.0.1:${port}`);
    const path = url.pathname;

    try {
      if (req.method === "GET" && path === "/api/health") {
        send(res, 200, health(state));
        return;
      }
      if (req.method === "GET" && path === "/api/models") {
        send(res, 200, {
          activeModelId: state.activeModelId,
          models: state.models,
          localModelsReachable: true,
        });
        return;
      }
      if (req.method === "POST" && path === "/api/models/active") {
        const body = await readJson(req);
        if (body.modelId) state.activeModelId = body.modelId;
        send(res, 200, { activeModelId: state.activeModelId });
        return;
      }
      if (req.method === "GET" && path === "/api/projects") {
        send(res, 200, { projects: state.projects });
        return;
      }
      if (req.method === "GET" && path === "/api/sessions") {
        send(res, 200, { sessions: state.sessions });
        return;
      }
      if (req.method === "POST" && path === "/api/sessions") {
        const body = await readJson(req);
        const now = new Date().toISOString();
        const session = {
          id: id(),
          title: body.title || "New coding session",
          projectPath: null,
          modelId: state.activeModelId,
          messages: [
            {
              id: id(8),
              role: "system",
              content: "You are Mac Coding Agent running locally on macOS.",
              createdAt: now,
            },
          ],
          createdAt: now,
          updatedAt: now,
        };
        state.sessions.unshift(session);
        send(res, 201, { session });
        return;
      }
      if (req.method === "GET" && path.startsWith("/api/sessions/")) {
        const sessionId = path.split("/")[3];
        const session = state.sessions.find((s) => s.id === sessionId);
        if (!session) {
          send(res, 404, { error: "Session not found" });
          return;
        }
        send(res, 200, { session });
        return;
      }
      if (req.method === "POST" && /\/api\/sessions\/[^/]+\/chat$/.test(path)) {
        const sessionId = path.split("/")[3];
        const session = state.sessions.find((s) => s.id === sessionId);
        if (!session) {
          send(res, 404, { error: "Session not found" });
          return;
        }
        const body = await readJson(req);
        const content = String(body.content || "").trim();
        if (!content) {
          send(res, 400, { error: "content required" });
          return;
        }
        const now = new Date().toISOString();
        session.messages.push({
          id: id(8),
          role: "user",
          content,
          createdAt: now,
        });
        if (session.title === "New coding session") {
          session.title = content.slice(0, 48);
        }
        const reply = stubComplete(content);
        session.messages.push({
          id: id(8),
          role: "assistant",
          content: reply,
          createdAt: new Date().toISOString(),
        });
        session.updatedAt = new Date().toISOString();
        send(res, 200, {
          sessionId,
          reply,
          taskId: id(),
          session,
        });
        return;
      }
      if (req.method === "GET" && path === "/api/billing/plans") {
        send(res, 200, {
          plans: [
            {
              id: "pro_monthly",
              name: "Pro Monthly",
              priceLabel: "$19 / month",
              description: "Pro updates + license sync",
              macDownload: true,
            },
            {
              id: "pro_lifetime",
              name: "Pro Lifetime",
              priceLabel: "$99 once",
              description: "Lifetime Pro unlock",
              macDownload: true,
            },
          ],
          stripeConfigured: false,
        });
        return;
      }

      send(res, 404, { error: "Not found" });
    } catch (error) {
      const status =
        error && typeof error === "object" && "statusCode" in error
          ? Number(error.statusCode) || 500
          : 500;
      send(res, status, {
        error: error instanceof Error ? error.message : "Server error",
      });
    }
  });

  return new Promise((resolve, reject) => {
    server.listen(port, "127.0.0.1", () => {
      const address = server.address();
      const boundPort =
        typeof address === "object" && address ? address.port : port;
      resolve({ server, port: boundPort, state });
    });
    server.on("error", reject);
  });
}

module.exports = { createServer, health, stubComplete };
