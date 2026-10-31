import { BillingStore, loadBillingConfig } from "./billing.js";
import { loadConfig } from "./config.js";
import { AgentService } from "./agent-service.js";
import { createServer } from "./server.js";
import { AgentStore } from "./store.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const store = new AgentStore(config.dataDir, "stub-coder");
  const billing = new BillingStore(config.dataDir);
  await billing.load();
  const agent = new AgentService(config, store);
  await agent.start();

  const billingConfig = loadBillingConfig(process.env, config.dataDir);
  const app = createServer(agent, billing);
  app.listen(config.port, config.host, () => {
    console.log(
      `Mac Coding Agent listening on http://${config.host}:${config.port} (uptime clock started)`,
    );
    console.log(
      billingConfig.secretKey
        ? "Stripe billing connected"
        : "Stripe billing running in demo mode (set STRIPE_SECRET_KEY)",
    );
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
