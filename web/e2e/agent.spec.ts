import { expect, test } from "@playwright/test";

test.describe("Mac Coding Agent web app", () => {
  test("home page brands Mac Coding Agent", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Mac Coding Agent").first()).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: /Always-on coding on your Mac/i,
      }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Open agent" })).toBeVisible();
  });

  test("agent dashboard chats with the local daemon", async ({ page }) => {
    await page.goto("/app");
    await expect(page.getByRole("heading", { name: "Agent" })).toBeVisible();
    await expect(page.getByTestId("status-pill")).toContainText(/running|Connecting/i, {
      timeout: 15_000,
    });

    await page.getByTestId("prompt-input").fill("hello from e2e");
    await page.getByTestId("send-prompt").click();

    await expect(page.getByTestId("messages")).toContainText("hello from e2e", {
      timeout: 20_000,
    });
    await expect(page.getByTestId("messages")).toContainText(/Mac Coding Agent/i, {
      timeout: 20_000,
    });
  });

  test("models page lists stub or local models", async ({ page }) => {
    await page.goto("/models");
    await expect(page.getByRole("heading", { name: "Models" })).toBeVisible();
    await expect(page.getByTestId("models-grid")).toContainText(/Stub|Ollama|model/i, {
      timeout: 15_000,
    });
  });

  test("projects page lists Mac Coding Agent workspace", async ({ page }) => {
    await page.goto("/projects");
    await expect(page.getByTestId("projects-grid")).toContainText("Mac Coding Agent", {
      timeout: 15_000,
    });
  });

  test("iPhone companion preview shows live status", async ({ page }) => {
    await page.goto("/iphone");
    await expect(page.getByTestId("iphone-frame")).toBeVisible();
    await expect(page.getByTestId("iphone-frame")).toContainText(/running|Status/i, {
      timeout: 15_000,
    });
  });

  test("Stripe pricing checkout issues demo license and unlocks Mac download", async ({
    page,
  }) => {
    await page.goto("/pricing");
    await expect(page.getByTestId("pricing-grid")).toBeVisible({ timeout: 15_000 });
    await page.getByTestId("billing-email").fill("buyer@example.com");
    await page.getByTestId("checkout-pro_lifetime").click();
    await expect(page.getByTestId("payment-success")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("issued-license")).toContainText(/MCA-/);
    const license = (await page.getByTestId("issued-license").textContent())?.trim();
    expect(license).toMatch(/^MCA-/);

    await page.goto("/download");
    await page.getByTestId("license-input").fill(license!);
    await page.getByRole("button", { name: "Verify" }).click();
    await expect(page.getByTestId("download-ready")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("macos-download-link")).toBeVisible();
  });
});
