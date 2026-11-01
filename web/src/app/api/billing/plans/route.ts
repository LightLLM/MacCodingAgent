import { NextResponse } from "next/server";
import { plans } from "@/server/billing";
import { getBillingRuntime } from "@/server/billing-runtime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const { config } = getBillingRuntime();
  return NextResponse.json({
    plans: plans(),
    publishableKey: config.publishableKey,
    stripeConfigured: Boolean(config.secretKey),
  });
}
