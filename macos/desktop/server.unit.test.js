const { createServer, stubComplete } = require("./server");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function testStubComplete() {
  assert(stubComplete("").includes("Mac Mini"), "empty prompt mentions Mac Mini");
  assert(stubComplete("hello").includes("macOS"), "hello mentions macOS");
  assert(stubComplete("Build a React component").includes("```tsx"), "react snippet");
  assert(stubComplete("refactor auth").includes("Plan:"), "generic plan");
}

async function testHealthAndChat() {
  const { server, port } = await createServer(0);
  try {
    const health = await fetch(`http://127.0.0.1:${port}/api/health`).then((r) =>
      r.json(),
    );
    assert(health.name === "Mac Coding Agent", "health name");
    assert(health.desktop === true, "desktop flag");
    assert(health.status === "running", "running status");
    assert(typeof health.uptimeSeconds === "number", "uptime");

    const models = await fetch(`http://127.0.0.1:${port}/api/models`).then((r) =>
      r.json(),
    );
    assert(models.models.length >= 1, "has models");

    const created = await fetch(`http://127.0.0.1:${port}/api/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Mac unit session" }),
    }).then((r) => r.json());
    assert(created.session.id, "session id");

    const chat = await fetch(
      `http://127.0.0.1:${port}/api/sessions/${created.session.id}/chat`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "hello from unit test" }),
      },
    ).then((r) => r.json());
    assert(chat.reply.includes("Mac Coding Agent"), "chat reply");
    assert(chat.session.messages.length >= 3, "messages appended");

    const listed = await fetch(`http://127.0.0.1:${port}/api/sessions`).then((r) =>
      r.json(),
    );
    assert(listed.sessions.some((s) => s.id === created.session.id), "session listed");

    const projects = await fetch(`http://127.0.0.1:${port}/api/projects`).then((r) =>
      r.json(),
    );
    assert(projects.projects[0].name.includes("Mac"), "project name");
  } finally {
    server.close();
  }
}

async function testRejectEmptyChat() {
  const { server, port } = await createServer(0);
  try {
    const created = await fetch(`http://127.0.0.1:${port}/api/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    }).then((r) => r.json());
    const res = await fetch(
      `http://127.0.0.1:${port}/api/sessions/${created.session.id}/chat`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "   " }),
      },
    );
    assert(res.status === 400, "empty chat rejected");
  } finally {
    server.close();
  }
}

async function main() {
  await testStubComplete();
  await testHealthAndChat();
  await testRejectEmptyChat();
  console.log("PASS macos/desktop/server.unit.test.js");
}

main().catch((error) => {
  console.error("FAIL", error);
  process.exit(1);
});
