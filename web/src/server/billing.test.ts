import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  BillingStore,
  createCheckoutSession,
  entitlementsFor,
  loadBillingConfig,
  mintSignedLicense,
  verifySignedLicense,
} from "./billing";

const dirs: string[] = [];

afterEach(async () => {
  await Promise.all(dirs.splice(0).map((d) => rm(d, { recursive: true, force: true })));
});

describe("web billing module", () => {
  it("issues and verifies signed licenses", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "web-bill-"));
    dirs.push(dir);
    const config = loadBillingConfig({ MCA_APP_URL: "http://localhost:3000" }, dir);
    const license = mintSignedLicense(config, {
      email: "prod@example.com",
      plan: "pro_lifetime",
    });
    const verified = verifySignedLicense(license.licenseKey, config);
    expect(verified?.email).toBe("prod@example.com");
    expect(entitlementsFor(verified!).macDownloadUnlocked).toBe(true);
  });

  it("rejects tampered licenses", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "web-bill-"));
    dirs.push(dir);
    const config = loadBillingConfig({}, dir);
    const license = mintSignedLicense(config, {
      email: "a@b.com",
      plan: "pro_monthly",
    });
    expect(verifySignedLicense(license.licenseKey + "x", config)).toBeUndefined();
  });

  it("demo checkout unlocks mac download", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "web-bill-"));
    dirs.push(dir);
    const store = new BillingStore(dir);
    await store.load();
    const config = loadBillingConfig({ MCA_APP_URL: "https://example.com" }, dir);
    const result = await createCheckoutSession(store, config, {
      email: "buyer@example.com",
      plan: "pro_monthly",
    });
    expect(result.mode).toBe("demo");
    expect(result.url).toContain("https://example.com/billing/success");
    expect(store.findByEmail("buyer@example.com")?.macDownloadUnlocked).toBe(true);
  });
});
