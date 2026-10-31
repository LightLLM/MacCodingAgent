import { NextResponse } from "next/server";
import { entitlementsFor } from "@/server/billing";
import { getBillingRuntime } from "@/server/billing-runtime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const licenseKey = url.searchParams.get("license") ?? "";
  const email = url.searchParams.get("email") ?? "";
  const { store, ready } = getBillingRuntime();
  await ready;
  const license = licenseKey
    ? store.findByKey(licenseKey)
    : email
      ? store.findByEmail(email)
      : null;
  return NextResponse.json(entitlementsFor(license ?? null));
}
