const BETTER_DX_SSE_URL = "http://localhost:1337/events";

interface LogMessage {
  type: "stdout" | "stderr" | "system";
  data: string;
  timestamp: number;
}

// ANSI color codes to CSS colors (Dracula theme)
const ANSI_COLORS: Record<number, string> = {
  30: "#282a36", // Black
  31: "#ff5c57", // Red
  32: "#5af78e", // Green
  33: "#f3f99d", // Yellow
  34: "#57c7ff", // Blue
  35: "#ff6ac1", // Magenta
  36: "#9aedfe", // Cyan
  37: "#f1f1f0", // White
  90: "#686868", // Bright Black
  91: "#ff5c57", // Bright Red
  92: "#5af78e", // Bright Green
  93: "#f3f99d", // Bright Yellow
  94: "#57c7ff", // Bright Blue
  95: "#ff6ac1", // Bright Magenta
  96: "#9aedfe", // Bright Cyan
  97: "#eff0eb", // Bright White
};

interface ParsedSegment {
  text: string;
  style: string;
}

function parseAnsiToConsole(text: string): ParsedSegment[] {
  const segments: ParsedSegment[] = [];
  let currentText = "";
  let currentStyle = "";
  let i = 0;

  while (i < text.length) {
    if (text[i] === "\x1b" && text[i + 1] === "[") {
      // Found ANSI escape sequence
      if (currentText) {
        segments.push({ text: currentText, style: currentStyle });
        currentText = "";
      }

      // Find the end of the escape sequence
      let j = i + 2;
      while (j < text.length && text[j] !== "m" && text[j] !== "H") {
        j++;
      }

      // Skip non-color codes (like cursor positioning)
      if (text[j] !== "m") {
        i = j + 1;
        continue;
      }

      const code = text.slice(i + 2, j);
      const codes = code.split(";").map((c) => Number.parseInt(c, 10) || 0);

      // Reset styles
      if (codes.includes(0)) {
        currentStyle = "";
      } else {
        const styles: string[] = [];

        for (const code of codes) {
          if (code === 1) {
            styles.push("font-weight: bold");
          } else if (code === 2) {
            styles.push("opacity: 0.7");
          } else if (code === 22) {
            // Reset bold/dim
            styles.push("font-weight: normal");
            styles.push("opacity: 1");
          } else if (code >= 30 && code <= 37) {
            styles.push(`color: ${ANSI_COLORS[code] ?? "#eff0eb"}`);
          } else if (code >= 90 && code <= 97) {
            styles.push(`color: ${ANSI_COLORS[code] ?? "#eff0eb"}`);
          } else if (code >= 40 && code <= 47) {
            // Background colors
            const fgCode = code - 10;
            styles.push(
              `background-color: ${ANSI_COLORS[fgCode] ?? "#282a36"}`
            );
          } else if (code >= 100 && code <= 107) {
            // Bright background colors
            const fgCode = code - 10;
            styles.push(
              `background-color: ${ANSI_COLORS[fgCode] ?? "#282a36"}`
            );
          } else if (code === 39) {
            // Reset foreground color
            styles.push("color: inherit");
          } else if (code === 49) {
            // Reset background color
            styles.push("background-color: transparent");
          }
        }

        currentStyle = styles.join("; ");
      }

      i = j + 1;
    } else {
      currentText += text[i];
      i++;
    }
  }

  if (currentText) {
    segments.push({ text: currentText, style: currentStyle });
  }

  return segments.length > 0 ? segments : [{ text, style: "" }];
}

function logToConsole(message: LogMessage) {
  const data = message.data.trimEnd();
  if (!data) {
    return;
  }

  // Split by lines and process each line separately
  const lines = data.split("\n");

  for (const line of lines) {
    if (!line.trim() && lines.length > 1) {
      // Skip empty lines unless it's the only line
      continue;
    }

    const segments = parseAnsiToConsole(line);

    if (segments.length === 0) {
      continue;
    }

    // Build console.log arguments
    // Combine all format strings into one, with styles as separate arguments
    const formatParts: string[] = [];
    const styleParts: string[] = [];

    for (const segment of segments) {
      if (segment.text) {
        formatParts.push(`%c${segment.text}`);
        styleParts.push(segment.style || "color: inherit");
      }
    }

    if (formatParts.length === 0) {
      continue;
    }

    // Combine all format strings into a single string
    const formatString = formatParts.join("");

    // Determine log level based on message type
    let logMethod = "log";
    if (message.type === "stderr") {
      logMethod = "error";
    } else if (message.type === "system") {
      logMethod = "info";
    }

    // Build the console call: console.log(formatString, style1, style2, ...)
    const script = `(function() {
      const format = ${JSON.stringify(formatString)};
      const styles = ${JSON.stringify(styleParts)};
      console.${logMethod}(format, ...styles);
    })()`;

    chrome.devtools.inspectedWindow.eval(script);
  }
}

function connectToSSE() {
  const eventSource = new EventSource(BETTER_DX_SSE_URL);

  eventSource.addEventListener("log", (event) => {
    try {
      const message: LogMessage = JSON.parse(event.data);
      logToConsole(message);
    } catch {
      // Intentionally empty - skip malformed JSON
    }
  });

  eventSource.addEventListener("error", () => {
    eventSource.close();
    setTimeout(connectToSSE, 3000);
  });
}

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
try {
  chrome.devtools.panels.create(
    "Turborepo",
    "icon/128.png",
    "turbo-panel.html"
  );
} catch (error) {
  alert(error);
}
try {
  chrome.devtools.panels.create("AI", "icon/128.png", "ai-panel.html");
} catch (error) {
  alert(error);
}
