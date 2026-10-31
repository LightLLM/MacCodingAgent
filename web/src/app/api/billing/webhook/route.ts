import { NextResponse } from "next/server";
import { applyStripeEvent, verifyStripeWebhook } from "@/server/billing";
import { getBillingRuntime } from "@/server/billing-runtime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature") ?? undefined;
  const { store, ready, config } = getBillingRuntime();
  await ready;

  if (!verifyStripeWebhook(config, rawBody, signature)) {
    return NextResponse.json({ error: "Invalid Stripe signature" }, { status: 400 });
  }

  try {
    const event = JSON.parse(rawBody) as {
      type: string;
      data?: { object?: Record<string, unknown> };
    };
    const license = await applyStripeEvent(store, event);
    return NextResponse.json({
      received: true,
      licenseKey: license?.licenseKey ?? null,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Webhook handling failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
