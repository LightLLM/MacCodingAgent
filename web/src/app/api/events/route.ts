import { getHostedAgent } from "@/server/agent";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const encoder = new TextEncoder();
  let timer: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream({
    start(controller) {
      const send = () => {
        const payload = `event: health\ndata: ${JSON.stringify(getHostedAgent().health())}\n\n`;
        controller.enqueue(encoder.encode(payload));
      };
      send();
      timer = setInterval(send, 2000);
    },
    cancel() {
      if (timer) clearInterval(timer);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
