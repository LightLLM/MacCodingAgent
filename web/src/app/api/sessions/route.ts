import { NextResponse } from "next/server";
import { getHostedAgent } from "@/server/agent";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const agent = getHostedAgent();
  return NextResponse.json({ sessions: agent.sessions });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    title?: string;
    projectPath?: string | null;
    modelId?: string;
  };
  const session = getHostedAgent().createSession(body);
  return NextResponse.json({ session }, { status: 201 });
}
