import { NextResponse } from "next/server";
import { getHostedAgent } from "@/server/agent";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { modelId?: string }
    | null;
  if (!body?.modelId) {
    return NextResponse.json({ error: "modelId required" }, { status: 400 });
  }
  const agent = getHostedAgent();
  agent.activeModelId = body.modelId;
  return NextResponse.json({ activeModelId: body.modelId });
}
