import { newWebSocketRpcSession } from "capnweb";

interface BetterDevApi {
  info(): Promise<{
    baseUrl: string;
    directory: string;
    projectId: string;
    projectUrl: string;
  }>;
  sessionList(): Promise<unknown[]>;
}

const RPC_URL = "ws://127.0.0.1:1337/rpc";
const OPENCODE_BASE_URL = "http://127.0.0.1:4096";

const iframe = document.getElementById("opencode-frame") as HTMLIFrameElement;
const errorEl = document.getElementById("error") as HTMLDivElement;

function showError() {
  iframe.style.display = "none";
  errorEl.style.display = "flex";
}

function navigateToSession(projectId: string, sessionId: string) {
  iframe.src = `${OPENCODE_BASE_URL}/${projectId}/session/${sessionId}`;
}

browser.runtime.onMessage.addListener(
  (message: { type: string; projectId?: string; sessionId?: string }) => {
    if (
      message.type === "opencode:navigate" &&
      message.projectId &&
      message.sessionId
    ) {
      navigateToSession(message.projectId, message.sessionId);
    }
  }
);

async function init() {
  try {
    const stub = newWebSocketRpcSession<BetterDevApi>(RPC_URL);

    const info = await stub.info();
    iframe.src = info.projectUrl;
    iframe.style.display = "block";
  } catch (err) {
    console.error("[opencode-panel] Failed to connect to RPC:", err);
    showError();
  }
}

init();
