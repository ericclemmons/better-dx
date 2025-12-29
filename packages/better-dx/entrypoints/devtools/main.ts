/// <reference path="../../../.wxt/wxt.d.ts" />

// const BETTER_DX_SSE_URL = "http://localhost:1337/events";
// const TASK_PREFIX_REGEX = /^([a-z0-9@/_-]+:[a-z0-9_-]+):\s*/i;

// interface LogMessage {
//   type: "stdout" | "stderr" | "system";
//   data: string;
//   timestamp: number;
// }

// type LogLevel = "log" | "info" | "warn" | "error" | "debug";

// function parseTaskFromLine(line: string): {
//   task: string | null;
//   content: string;
// } {
//   const taskMatch = line.match(TASK_PREFIX_REGEX);
//   if (taskMatch) {
//     return {
//       task: taskMatch[1] ?? null,
//       content: line.slice(taskMatch[0].length),
//     };
//   }
//   return { task: null, content: line };
// }

// function detectLogLevel(
//   content: string,
//   streamType: LogMessage["type"]
// ): LogLevel {
//   const lower = content.toLowerCase();

//   if (streamType === "system") {
//     return "info";
//   }

//   if (streamType === "stderr") {
//     if (
//       lower.includes("error") ||
//       lower.includes("err!") ||
//       lower.includes("failed")
//     ) {
//       return "error";
//     }
//     return "warn";
//   }

//   if (
//     lower.includes("error") ||
//     lower.includes("err!") ||
//     lower.includes("failed")
//   ) {
//     return "error";
//   }
//   if (lower.includes("warn") || lower.includes("warning")) {
//     return "warn";
//   }
//   if (lower.includes("debug") || lower.includes("verbose")) {
//     return "debug";
//   }
//   if (
//     lower.includes("info") ||
//     lower.includes("ready") ||
//     lower.includes("started")
//   ) {
//     return "info";
//   }

//   return "log";
// }

// function escapeForEval(str: string): string {
//   return str
//     .replace(/\\/g, "\\\\")
//     .replace(/'/g, "\\'")
//     .replace(/\n/g, "\\n")
//     .replace(/\r/g, "\\r");
// }

// function processMessage(message: LogMessage) {
//   const lines = message.data.split("\n").filter((line) => line.trim());

//   for (const line of lines) {
//     const { task, content } = parseTaskFromLine(line);
//     const trimmedContent = content.trim();

//     if (!trimmedContent) {
//       continue;
//     }

//     const level = detectLogLevel(trimmedContent, message.type);
//     const escaped = escapeForEval(trimmedContent);
//     const taskLabel = task ?? "turbo";

//     const script = `console.${level}('%c[${escapeForEval(taskLabel)}]%c ${escaped}', 'color: #888; font-weight: bold', 'color: inherit')`;
//     browser.devtools.inspectedWindow.eval(script);
//   }
// }

// function connectToSSE() {
//   const eventSource = new EventSource(BETTER_DX_SSE_URL);

//   eventSource.addEventListener("log", (event) => {
//     try {
//       const message: LogMessage = JSON.parse(event.data);
//       processMessage(message);
//     } catch {
//       // Intentionally empty - skip malformed JSON
//     }
//   });

//   eventSource.addEventListener("error", () => {
//     eventSource.close();
//     setTimeout(connectToSSE, 3000);
//   });
// }

// connectToSSE();

try {
  chrome.devtools.panels.create(
    "OpenCode",
    "icon/128.png",
    "opencode-panel.html"
  );
} catch (error) {
  alert(error);
}
