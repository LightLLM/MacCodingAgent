const { createServer, stubComplete } = require("./server");

async function main() {
  if (!stubComplete("hello").includes("Mac Coding Agent")) {
    throw new Error("stub hello failed");
  }
  const { server, port } = await createServer(0);
  const health = await fetch(`http://127.0.0.1:${port}/api/health`).then((r) =>
    r.json(),
  );
  if (health.name !== "Mac Coding Agent") throw new Error("health failed");
  const created = await fetch(`http://127.0.0.1:${port}/api/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Test" }),
  }).then((r) => r.json());
  const chat = await fetch(
    `http://127.0.0.1:${port}/api/sessions/${created.session.id}/chat`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "hello from mac mini" }),
    },
  ).then((r) => r.json());
  if (!chat.reply.includes("Mac Coding Agent")) throw new Error("chat failed");
  server.close();
  console.log("desktop server ok on port", port);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
