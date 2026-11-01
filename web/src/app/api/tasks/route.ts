import { NextResponse } from "next/server";
import { getHostedAgent } from "@/server/agent";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ tasks: getHostedAgent().tasks });
}
