import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  BillingStore,
  applyStripeEvent,
  createCheckoutSession,
  entitlementsFor,
  loadBillingConfig,
  mintLicenseKey,
} from "./billing.js";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

async function tempBilling() {
  const dir = await mkdtemp(path.join(os.tmpdir(), "mca-bill-"));
  tempDirs.push(dir);
  const store = new BillingStore(dir);
  await store.load();
  const config = loadBillingConfig(
    {
      MCA_APP_URL: "http://localhost:3000",
    },
    dir,
  );
  return { store, config };
}

describe("billing", () => {
  it("mints legacy MCA license keys", () => {
    expect(mintLicenseKey()).toMatch(
      /^MCA-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/,
    );
  });

  it("creates demo checkout and unlocks Mac download", async () => {
    const { store, config } = await tempBilling();
    const checkout = await createCheckoutSession(store, config, {
      email: "buyer@example.com",
      plan: "pro_lifetime",
    });
    expect(checkout.mode).toBe("demo");
    expect(checkout.url).toContain("/billing/success");
    const license = store.findByEmail("buyer@example.com");
    expect(license?.macDownloadUnlocked).toBe(true);
    expect(entitlementsFor(license!).pro).toBe(true);
  });

  it("applies Stripe checkout.session.completed events", async () => {
    const { store, config } = await tempBilling();
    const license = await applyStripeEvent(
      store,
      {
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_test_123",
            customer_email: "paid@example.com",
            metadata: { plan: "pro_monthly" },
            customer: "cus_123",
            subscription: "sub_123",
          },
        },
      },
      config,
    );
    expect(license?.email).toBe("paid@example.com");
    expect(license?.status).toBe("active");
    expect(license?.macDownloadUnlocked).toBe(true);
    expect(license?.licenseKey.startsWith("MCA1.")).toBe(true);
  });

  it("verifies signed licenses without shared storage", async () => {
    const { store, config } = await tempBilling();
    const checkout = await createCheckoutSession(store, config, {
      email: "stateless@example.com",
      plan: "pro_monthly",
    });
    const key = new URL(checkout.url).searchParams.get("license")!;
    const fresh = new BillingStore(config.dataDir);
    await fresh.load();
    // Simulate another serverless isolate by resolving only via signature
    const resolved = fresh.resolveLicense(key, config);
    expect(resolved?.email).toBe("stateless@example.com");
    expect(entitlementsFor(resolved!).macDownloadUnlocked).toBe(true);
  });

  it("rejects forged signatures", async () => {
    const { config } = await tempBilling();
    const { mintSignedLicense, verifySignedLicense } = await import("./billing.js");
    const good = mintSignedLicense(config, {
      email: "forge@example.com",
      plan: "pro_lifetime",
    });
    const forged = good.licenseKey.replace(/\.[^.]+$/, ".AAAAAAAAAAAAAAAAaaaaaa");
    expect(verifySignedLicense(forged, config)).toBeUndefined();
  });
});
