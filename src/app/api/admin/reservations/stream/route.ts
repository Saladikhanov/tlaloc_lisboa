import { isAdminRequestAuthenticated } from "@/lib/admin-request";
import { subscribeToAdminEvents } from "@/lib/admin-events";

export const dynamic = "force-dynamic";

const encoder = new TextEncoder();

const toSseChunk = (event: string, data: string): Uint8Array =>
  encoder.encode(`event: ${event}\ndata: ${data}\n\n`);

export async function GET(request: Request) {
  if (!(await isAdminRequestAuthenticated())) {
    return new Response("Unauthorized", { status: 401 });
  }

  let cleanup = () => {};
  let heartbeat: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(toSseChunk("ready", JSON.stringify({ ok: true })));

      cleanup = subscribeToAdminEvents((event) => {
        controller.enqueue(toSseChunk(event.type, JSON.stringify(event)));
      });

      heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(": keepalive\n\n"));
      }, 15000);

      request.signal.addEventListener(
        "abort",
        () => {
          cleanup();
          if (heartbeat) {
            clearInterval(heartbeat);
          }
          controller.close();
        },
        { once: true },
      );
    },
    cancel() {
      cleanup();
      if (heartbeat) {
        clearInterval(heartbeat);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
