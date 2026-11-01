import { NextResponse } from "next/server";
import { entitlementsFor } from "@/server/billing";
import { getBillingRuntime } from "@/server/billing-runtime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ key: string }> },
) {
  const { key } = await context.params;
  const { store, ready, config } = getBillingRuntime();
  await ready;
  const license = store.resolveLicense(key, config);
  if (!license) {
    return NextResponse.json({ error: "License not found" }, { status: 404 });
  }
  return NextResponse.json({
    license,
    entitlements: entitlementsFor(license),
  });
}
