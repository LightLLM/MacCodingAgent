import { NextResponse } from "next/server";
import { createCheckoutSession } from "@/server/billing";
import { getBillingRuntime } from "@/server/billing-runtime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    email?: string;
    plan?: "pro_monthly" | "pro_lifetime";
  } | null;

  if (!body?.email || !body.plan) {
    return NextResponse.json(
      { error: "email and plan are required" },
      { status: 400 },
    );
  }

  const { store, ready, config } = getBillingRuntime();
  await ready;

  try {
    const result = await createCheckoutSession(store, config, {
      email: body.email,
      plan: body.plan,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
