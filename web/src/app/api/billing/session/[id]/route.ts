import { NextResponse } from "next/server";
import { entitlementsFor, finalizeCheckoutSession } from "@/server/billing";
import { getBillingRuntime } from "@/server/billing-runtime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const { store, ready, config } = getBillingRuntime();
  await ready;
  try {
    const license = await finalizeCheckoutSession(store, config, id);
    return NextResponse.json({
      license,
      entitlements: entitlementsFor(license),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not finalize session";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
