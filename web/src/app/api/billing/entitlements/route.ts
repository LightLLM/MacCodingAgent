import { NextResponse } from "next/server";
import { entitlementsFor } from "@/server/billing";
import { getBillingRuntime } from "@/server/billing-runtime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const licenseKey = url.searchParams.get("license") ?? "";
  const email = url.searchParams.get("email") ?? "";
  const { store, ready, config } = getBillingRuntime();
  await ready;
  const license = licenseKey
    ? store.resolveLicense(licenseKey, config)
    : email
      ? store.findByEmail(email)
      : null;
  return NextResponse.json(entitlementsFor(license ?? null));
}
