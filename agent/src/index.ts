import type { Server } from "node:http";
import { BillingStore, loadBillingConfig } from "./billing.js";
import { loadConfig } from "./config.js";
import { AgentService } from "./agent-service.js";
import { createServer } from "./server.js";
import { AgentStore } from "./store.js";

async function main(): Promise<void> {
  const config = loadConfig();
  if (!Number.isFinite(config.port) || config.port <= 0) {
    throw new Error(`Invalid MCA_PORT: ${config.port}`);
  }

  const store = new AgentStore(config.dataDir, "stub-coder");
  const billing = new BillingStore(config.dataDir);
  await billing.load();
  const agent = new AgentService(config, store);
  await agent.start();

  const billingConfig = loadBillingConfig(process.env, config.dataDir);
  if (
    process.env.NODE_ENV === "production" &&
    !billingConfig.secretKey &&
    billingConfig.licenseSecret === "mac-coding-agent-dev-license-secret"
  ) {
    console.warn(
      "[warn] Production is using the default license secret. Set MCA_LICENSE_SECRET or STRIPE_SECRET_KEY.",
    );
  }

  const app = createServer(agent, billing);
  const server: Server = app.listen(config.port, config.host, () => {
    console.log(
      `Mac Coding Agent listening on http://${config.host}:${config.port} (uptime clock started)`,
    );
    console.log(
      billingConfig.secretKey
        ? "Stripe billing connected"
        : "Stripe billing running in demo mode (set STRIPE_SECRET_KEY)",
    );
  });

  const shutdown = (signal: string) => {
    console.log(`Received ${signal}, shutting down gracefully…`);
    server.close(async () => {
      try {
        await store.persistNow();
        await billing.persist();
      } catch (error) {
        console.error("Error while persisting on shutdown", error);
      }
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
