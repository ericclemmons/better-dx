import { Hono } from "hono";
import { cors } from "hono/cors";
import { stream as streamResponse } from "hono/streaming";

export interface LogMessage {
  type: "stdout" | "stderr" | "system";
  data: string;
  timestamp: number;
}

const rawSubscribers = new Set<(message: LogMessage) => void>();
const rawMessageBuffer: LogMessage[] = [];
const MAX_BUFFER_SIZE = 1000;

export function broadcast(message: LogMessage) {
  // Store raw message for SSE
  rawMessageBuffer.push(message);
  if (rawMessageBuffer.length > MAX_BUFFER_SIZE) {
    rawMessageBuffer.shift();
  }

  // Broadcast raw messages to SSE subscribers (with original ANSI codes)
  for (const subscriber of rawSubscribers) {
    subscriber(message);
  }
}

export function createServer() {
  const app = new Hono();

  app.use("/*", cors());

  app.get("/events", (c) => {
    c.header("Content-Type", "text/event-stream");
    c.header("Cache-Control", "no-cache");
    c.header("Connection", "keep-alive");

    return streamResponse(c, async (stream) => {
      const encoder = new TextEncoder();

      // Send buffered raw messages first
      for (const message of rawMessageBuffer) {
        await stream.write(
          encoder.encode(`event: log\ndata: ${JSON.stringify(message)}\n\n`)
        );
      }

      // Subscribe to new messages
      const subscriber = async (message: LogMessage) => {
        try {
          await stream.write(
            encoder.encode(`event: log\ndata: ${JSON.stringify(message)}\n\n`)
          );
        } catch {
          // Client disconnected
          rawSubscribers.delete(subscriber);
        }
      };

      rawSubscribers.add(subscriber);

      // Cleanup on abort
      stream.onAbort(() => {
        rawSubscribers.delete(subscriber);
      });

      // Wait indefinitely (until client disconnects)
      await new Promise(() => {
        // Intentionally empty - keeps connection alive
      });
    });
  });

  return app;
}
