import { useEffect, useState } from "react";

interface DevtoolsResult {
  url: string;
  ready: boolean;
}

interface DevtoolPanelProps {
  startDevtools: () => Promise<DevtoolsResult>;
  fallbackCommand: string;
}

type Status = "loading" | "ready" | "error";

const styles = {
  container: {
    width: "100%",
    height: "100%",
    background: "#1e1e1e",
    margin: 0,
    padding: 0,
    overflow: "hidden",
  },
  iframe: {
    width: "100%",
    height: "100%",
    border: "none",
  },
  status: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    color: "#888",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    textAlign: "center" as const,
    padding: 20,
  },
  heading: {
    color: "#ccc",
    marginBottom: 10,
    fontSize: 18,
    fontWeight: 500,
  },
  text: {
    marginBottom: 20,
  },
  code: {
    background: "#2d2d2d",
    padding: "8px 16px",
    borderRadius: 4,
    fontFamily: "monospace",
  },
  spinner: {
    width: 24,
    height: 24,
    border: "2px solid #444",
    borderTopColor: "#888",
    borderRadius: "50%",
    marginBottom: 16,
    animation: "spin 1s linear infinite",
  },
} as const;

export default function DevtoolPanel({
  startDevtools,
  fallbackCommand,
}: DevtoolPanelProps) {
  const [status, setStatus] = useState<Status>("loading");
  const [url, setUrl] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = "@keyframes spin { to { transform: rotate(360deg); } }";
    document.head.appendChild(style);

    startDevtools()
      .then((result) => {
        if (result.ready) {
          setUrl(result.url);
          setStatus("ready");
        } else {
          setError("Server did not become ready in time");
          setStatus("error");
        }
      })
      .catch((err) => {
        setError(err.message || "Failed to start devtools");
        setStatus("error");
      });

    return () => {
      document.head.removeChild(style);
    };
  }, [startDevtools]);

  if (status === "ready") {
    return <iframe src={url} style={styles.iframe} title="Devtools" />;
  }

  if (status === "error") {
    return (
      <div style={styles.status}>
        <h2 style={styles.heading}>Failed to Start</h2>
        <p style={styles.text}>{error}</p>
        <p style={styles.text}>Try running manually:</p>
        <code style={styles.code}>{fallbackCommand}</code>
      </div>
    );
  }

  return (
    <div style={styles.status}>
      <div style={styles.spinner} />
      <h2 style={styles.heading}>Starting...</h2>
    </div>
  );
}
