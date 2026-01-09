import { newHttpBatchRpcSession } from "capnweb";
import React from "react";
import ReactDOM from "react-dom/client";
import DevtoolPanel from "../../components/DevtoolPanel.tsx";

interface DevtoolsResult {
  url: string;
  ready: boolean;
}

interface BetterDevApi {
  startTurboDevtools(): Promise<DevtoolsResult>;
}

const RPC_URL = "http://127.0.0.1:1337/rpc";

function startTurboDevtools() {
  const rpc = newHttpBatchRpcSession<BetterDevApi>(RPC_URL);
  return rpc.startTurboDevtools();
}

const root = document.getElementById("root");
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <DevtoolPanel
        fallbackCommand="turbo devtools --no-open"
        startDevtools={startTurboDevtools}
      />
    </React.StrictMode>
  );
}
