import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type PlanId = "free" | "pro_monthly" | "pro_lifetime";

export interface LicenseRecord {
  licenseKey: string;
  email: string;
  plan: PlanId;
  status: "active" | "canceled" | "past_due" | "demo";
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripeSessionId: string | null;
  macDownloadUnlocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BillingConfig {
  secretKey: string | null;
  publishableKey: string | null;
  webhookSecret: string | null;
  priceMonthly: string | null;
  priceLifetime: string | null;
  appUrl: string;
  dataDir: string;
}

export interface CheckoutResult {
  mode: "stripe" | "demo";
  url: string;
  sessionId: string;
  publishableKey: string | null;
}

interface BillingState {
  licenses: LicenseRecord[];
}

function emptyState(): BillingState {
  return { licenses: [] };
}

export function loadBillingConfig(
  env: NodeJS.ProcessEnv = process.env,
  dataDir: string,
): BillingConfig {
  return {
    secretKey: env.STRIPE_SECRET_KEY || null,
    publishableKey:
      env.STRIPE_PUBLISHABLE_KEY ||
      env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
      null,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET || null,
    priceMonthly: env.STRIPE_PRICE_ID_PRO_MONTHLY || null,
    priceLifetime: env.STRIPE_PRICE_ID_PRO_LIFETIME || null,
    appUrl: env.MCA_APP_URL || env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3000",
    dataDir,
  };
}

export class BillingStore {
  private state: BillingState = emptyState();
  private readonly filePath: string;

  constructor(dataDir: string) {
    this.filePath = path.join(dataDir, "billing.json");
  }

  async load(): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    try {
      const raw = await readFile(this.filePath, "utf8");
      this.state = { ...emptyState(), ...(JSON.parse(raw) as BillingState) };
    } catch {
      await this.persist();
    }
  }

  async persist(): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(this.state, null, 2), "utf8");
  }

  list(): LicenseRecord[] {
    return [...this.state.licenses].sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt),
    );
  }

  findByKey(licenseKey: string): LicenseRecord | undefined {
    return this.state.licenses.find((l) => l.licenseKey === licenseKey);
  }

  findByEmail(email: string): LicenseRecord | undefined {
    return this.state.licenses.find(
      (l) => l.email.toLowerCase() === email.toLowerCase(),
    );
  }

  upsert(record: LicenseRecord): LicenseRecord {
    const idx = this.state.licenses.findIndex(
      (l) => l.licenseKey === record.licenseKey || l.email === record.email,
    );
    if (idx >= 0) this.state.licenses[idx] = record;
    else this.state.licenses.unshift(record);
    void this.persist();
    return record;
  }
}

export function mintLicenseKey(): string {
  const body = randomBytes(8).toString("hex").toUpperCase();
  return `MCA-${body.slice(0, 4)}-${body.slice(4, 8)}-${body.slice(8, 12)}-${body.slice(12, 16)}`;
}

export function plans() {
  return [
    {
      id: "pro_monthly" as const,
      name: "Pro Monthly",
      priceLabel: "$19 / month",
      amountCents: 1900,
      interval: "month" as const,
      description: "Unlimited local sessions, Mac app download, priority agent loop",
      macDownload: true,
    },
    {
      id: "pro_lifetime" as const,
      name: "Pro Lifetime",
      priceLabel: "$99 once",
      amountCents: 9900,
      interval: "one_time" as const,
      description: "One-time unlock for Mac download + Pro forever on this license",
      macDownload: true,
    },
  ];
}

async function stripeRequest<T>(
  config: BillingConfig,
  method: string,
  route: string,
  body?: URLSearchParams,
): Promise<T> {
  if (!config.secretKey) throw new Error("Stripe is not configured");
  const res = await fetch(`https://api.stripe.com/v1/${route}`, {
    method,
    headers: {
      Authorization: `Bearer ${config.secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const data = (await res.json()) as T & { error?: { message?: string } };
  if (!res.ok) {
    throw new Error(data.error?.message || `Stripe error (${res.status})`);
  }
  return data;
}

export async function createCheckoutSession(
  store: BillingStore,
  config: BillingConfig,
  input: { email: string; plan: Exclude<PlanId, "free"> },
): Promise<CheckoutResult> {
  const email = input.email.trim().toLowerCase();
  if (!email.includes("@")) throw new Error("Valid email required");

  if (!config.secretKey) {
    const licenseKey = mintLicenseKey();
    const now = new Date().toISOString();
    store.upsert({
      licenseKey,
      email,
      plan: input.plan,
      status: "demo",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      stripeSessionId: `demo_${licenseKey}`,
      macDownloadUnlocked: true,
      createdAt: now,
      updatedAt: now,
    });
    const url = `${config.appUrl}/billing/success?demo=1&license=${encodeURIComponent(licenseKey)}&email=${encodeURIComponent(email)}`;
    return {
      mode: "demo",
      url,
      sessionId: `demo_${licenseKey}`,
      publishableKey: config.publishableKey,
    };
  }

  const params = new URLSearchParams();
  params.set("mode", input.plan === "pro_monthly" ? "subscription" : "payment");
  params.set("success_url", `${config.appUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`);
  params.set("cancel_url", `${config.appUrl}/pricing?canceled=1`);
  params.set("customer_email", email);
  params.set("client_reference_id", input.plan);
  params.set("metadata[plan]", input.plan);
  params.set("metadata[product]", "mac-coding-agent");
  params.set("allow_promotion_codes", "true");

  const priceId =
    input.plan === "pro_monthly" ? config.priceMonthly : config.priceLifetime;

  if (priceId) {
    params.set("line_items[0][price]", priceId);
    params.set("line_items[0][quantity]", "1");
  } else {
    const plan = plans().find((p) => p.id === input.plan)!;
    params.set("line_items[0][price_data][currency]", "usd");
    params.set(
      "line_items[0][price_data][product_data][name]",
      `Mac Coding Agent ${plan.name}`,
    );
    params.set(
      "line_items[0][price_data][product_data][description]",
      plan.description,
    );
    params.set("line_items[0][price_data][unit_amount]", String(plan.amountCents));
    if (input.plan === "pro_monthly") {
      params.set("line_items[0][price_data][recurring][interval]", "month");
    }
    params.set("line_items[0][quantity]", "1");
  }

  const session = await stripeRequest<{ id: string; url: string }>(
    config,
    "POST",
    "checkout/sessions",
    params,
  );

  return {
    mode: "stripe",
    url: session.url,
    sessionId: session.id,
    publishableKey: config.publishableKey,
  };
}

export async function finalizeCheckoutSession(
  store: BillingStore,
  config: BillingConfig,
  sessionId: string,
): Promise<LicenseRecord> {
  if (sessionId.startsWith("demo_")) {
    const existing = store
      .list()
      .find((l) => l.stripeSessionId === sessionId || l.licenseKey === sessionId.replace(/^demo_/, ""));
    if (existing) return existing;
    throw new Error("Demo license not found");
  }

  if (!config.secretKey) throw new Error("Stripe is not configured");

  const session = await stripeRequest<{
    id: string;
    customer_email?: string | null;
    customer_details?: { email?: string | null } | null;
    customer?: string | null;
    subscription?: string | null;
    payment_status?: string;
    metadata?: { plan?: string };
    client_reference_id?: string | null;
  }>(config, "GET", `checkout/sessions/${sessionId}`);

  const email =
    session.customer_details?.email ||
    session.customer_email ||
    "buyer@unknown.local";
  const plan =
    (session.metadata?.plan as Exclude<PlanId, "free"> | undefined) ||
    (session.client_reference_id as Exclude<PlanId, "free"> | undefined) ||
    "pro_lifetime";

  const existing = store.list().find((l) => l.stripeSessionId === session.id);
  if (existing) return existing;

  const now = new Date().toISOString();
  const record: LicenseRecord = {
    licenseKey: mintLicenseKey(),
    email,
    plan,
    status: session.payment_status === "paid" ? "active" : "past_due",
    stripeCustomerId:
      typeof session.customer === "string" ? session.customer : null,
    stripeSubscriptionId:
      typeof session.subscription === "string" ? session.subscription : null,
    stripeSessionId: session.id,
    macDownloadUnlocked: true,
    createdAt: now,
    updatedAt: now,
  };
  return store.upsert(record);
}

export function verifyStripeWebhook(
  config: BillingConfig,
  rawBody: string,
  signatureHeader: string | undefined,
): boolean {
  if (!config.webhookSecret) return !config.secretKey; // allow unsigned only in demo
  if (!signatureHeader) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((piece) => {
      const [k, v] = piece.split("=");
      return [k, v];
    }),
  ) as { t?: string; v1?: string };

  if (!parts.t || !parts.v1) return false;
  const payload = `${parts.t}.${rawBody}`;
  const expected = createHmac("sha256", config.webhookSecret)
    .update(payload, "utf8")
    .digest("hex");

  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1));
  } catch {
    return false;
  }
}

export async function applyStripeEvent(
  store: BillingStore,
  event: {
    type: string;
    data?: { object?: Record<string, unknown> };
  },
): Promise<LicenseRecord | null> {
  const obj = event.data?.object ?? {};
  if (event.type === "checkout.session.completed") {
    const email =
      (obj.customer_details as { email?: string } | undefined)?.email ||
      (obj.customer_email as string | undefined) ||
      "buyer@unknown.local";
    const plan =
      ((obj.metadata as { plan?: PlanId } | undefined)?.plan as
        | Exclude<PlanId, "free">
        | undefined) || "pro_lifetime";
    const now = new Date().toISOString();
    const sessionId = String(obj.id ?? "");
    const existing = store.list().find((l) => l.stripeSessionId === sessionId);
    if (existing) {
      existing.status = "active";
      existing.macDownloadUnlocked = true;
      existing.updatedAt = now;
      return store.upsert(existing);
    }
    return store.upsert({
      licenseKey: mintLicenseKey(),
      email,
      plan,
      status: "active",
      stripeCustomerId:
        typeof obj.customer === "string" ? obj.customer : null,
      stripeSubscriptionId:
        typeof obj.subscription === "string" ? obj.subscription : null,
      stripeSessionId: sessionId,
      macDownloadUnlocked: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  if (
    event.type === "customer.subscription.deleted" ||
    event.type === "customer.subscription.updated"
  ) {
    const subId = String(obj.id ?? "");
    const status = String(obj.status ?? "");
    const license = store
      .list()
      .find((l) => l.stripeSubscriptionId === subId);
    if (!license) return null;
    license.status =
      status === "active" || status === "trialing" ? "active" : "canceled";
    license.macDownloadUnlocked = license.status === "active" || license.plan === "pro_lifetime";
    license.updatedAt = new Date().toISOString();
    return store.upsert(license);
  }

  return null;
}

export function entitlementsFor(license: LicenseRecord | null) {
  const pro =
    !!license &&
    (license.status === "active" || license.status === "demo") &&
    license.plan !== "free";
  return {
    plan: license?.plan ?? "free",
    status: license?.status ?? "active",
    pro,
    macDownloadUnlocked: !!license?.macDownloadUnlocked && pro,
    licenseKey: license?.licenseKey ?? null,
    email: license?.email ?? null,
  };
}
