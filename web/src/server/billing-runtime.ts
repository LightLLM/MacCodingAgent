import path from "node:path";
import { BillingStore, loadBillingConfig } from "./billing";

const globalKey = "__macCodingAgentBilling__";

export function getBillingRuntime() {
  const g = globalThis as typeof globalThis & {
    [globalKey]?: { store: BillingStore; ready: Promise<void> };
  };

  if (!g[globalKey]) {
    const dataDir =
      process.env.MCA_DATA_DIR ||
      (process.env.VERCEL ? "/tmp/mca-data" : path.join(process.cwd(), ".data"));
    const store = new BillingStore(dataDir);
    g[globalKey] = {
      store,
      ready: store.load(),
    };
  }

  const config = loadBillingConfig(
    process.env,
    process.env.MCA_DATA_DIR ||
      (process.env.VERCEL ? "/tmp/mca-data" : path.join(process.cwd(), ".data")),
  );

  return { store: g[globalKey]!.store, ready: g[globalKey]!.ready, config };
}
