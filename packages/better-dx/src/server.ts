import Convert from "ansi-to-html";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { stream as streamResponse } from "hono/streaming";

export interface LogMessage {
  type: "stdout" | "stderr" | "system";
  data: string;
  timestamp: number;
}

type LogSubscriber = (message: LogMessage) => void;

const subscribers = new Set<LogSubscriber>();
const messageBuffer: LogMessage[] = [];
const MAX_BUFFER_SIZE = 1000;

const convert = new Convert({
  fg: "#eff0eb",
  bg: "#282a36",
  newline: true,
  escapeXML: true,
  stream: false,
  colors: {
    0: "#282a36", // Black
    1: "#ff5c57", // Red
    2: "#5af78e", // Green
    3: "#f3f99d", // Yellow
    4: "#57c7ff", // Blue
    5: "#ff6ac1", // Magenta
    6: "#9aedfe", // Cyan
    7: "#f1f1f0", // White
    8: "#686868", // Bright Black
    9: "#ff5c57", // Bright Red
    10: "#5af78e", // Bright Green
    11: "#f3f99d", // Bright Yellow
    12: "#57c7ff", // Bright Blue
    13: "#ff6ac1", // Bright Magenta
    14: "#9aedfe", // Bright Cyan
    15: "#eff0eb", // Bright White
  },
});

export function broadcast(message: LogMessage) {
  // Convert ANSI codes to HTML
  const htmlData = convert.toHtml(message.data);
  const htmlMessage: LogMessage = {
    ...message,
    data: htmlData,
  };

  messageBuffer.push(htmlMessage);
  if (messageBuffer.length > MAX_BUFFER_SIZE) {
    messageBuffer.shift();
  }

  for (const subscriber of subscribers) {
    subscriber(htmlMessage);
  }
}

const HTML_HEADER = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>better-dx</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      height: 100%;
      overflow: hidden;
    }
    body {
      height: 100.001vh;
      font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
      background: #282a36;
      color: #eff0eb;
      font-size: 13px;
      line-height: 1.5;
      padding: 8px 16px;
      overflow-y: auto;
      overflow-x: hidden;
      white-space: pre-wrap;
      word-break: break-all;
    }
    body * {
      overflow-anchor: none;
    }
    #anchor {
      overflow-anchor: auto;
      height: 1px;
    }
  </style>
  <script>
    // Trigger initial scroll to enable scroll anchoring
    document.scrollingElement.scroll(0, 1);
  </script>
</head>
<body>
`;

export function createServer() {
  const app = new Hono();

  app.use("/*", cors());

  app.get("/", (c) => {
    c.header("Content-Type", "text/html; charset=utf-8");
    return streamResponse(c, async (stream) => {
      const encoder = new TextEncoder();

      // Send HTML header
      await stream.write(encoder.encode(HTML_HEADER));

      // Send buffered messages first
      for (const message of messageBuffer) {
        await stream.write(encoder.encode(message.data));
      }

      // Add anchor element at the end for scroll anchoring
      await stream.write(encoder.encode('<span id="anchor"></span>'));

      // Subscribe to new messages
      const subscriber: LogSubscriber = async (message) => {
        try {
          // Remove old anchor, add new content, then re-add anchor at bottom
          await stream.write(
            encoder.encode(`<script>
            (function() {
              const anchor = document.getElementById('anchor');
              if (anchor) anchor.remove();
              const div = document.createElement('div');
              div.innerHTML = ${JSON.stringify(message.data)};
              document.body.appendChild(div);
              const newAnchor = document.createElement('span');
              newAnchor.id = 'anchor';
              document.body.appendChild(newAnchor);
            })();
          </script>`)
          );
        } catch {
          // Client disconnected
          subscribers.delete(subscriber);
        }
      };

      subscribers.add(subscriber);

      // Cleanup on abort
      stream.onAbort(() => {
        subscribers.delete(subscriber);
      });

      // Wait indefinitely (until client disconnects)
      await new Promise(() => {
        // Intentionally empty - keeps connection alive
      });
    });
  });

  return app;
}
