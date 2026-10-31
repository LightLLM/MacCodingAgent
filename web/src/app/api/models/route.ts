import { NextResponse } from "next/server";
import { getHostedAgent } from "@/server/agent";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const agent = getHostedAgent();
  return NextResponse.json({
    activeModelId: agent.activeModelId,
    models: agent.models,
    localModelsReachable: true,
  });
}
