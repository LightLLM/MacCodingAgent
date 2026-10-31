import { loadConfig } from "./config.js";
import { AgentService } from "./agent-service.js";
import { createServer } from "./server.js";
import { AgentStore } from "./store.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const store = new AgentStore(config.dataDir, "stub-coder");
  const agent = new AgentService(config, store);
  await agent.start();

  const app = createServer(agent);
  app.listen(config.port, config.host, () => {
    console.log(
      `Mac Coding Agent listening on http://${config.host}:${config.port} (uptime clock started)`,
    );
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
