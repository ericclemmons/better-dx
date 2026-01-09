import { newHttpBatchRpcSession } from "capnweb";
import React from "react";
import ReactDOM from "react-dom/client";
import DevtoolPanel from "../../components/DevtoolPanel.tsx";

interface DevtoolsResult {
  url: string;
  ready: boolean;
}

interface BetterDevApi {
  startAiSdkDevtools(): Promise<DevtoolsResult>;
}

const RPC_URL = "http://127.0.0.1:1337/rpc";

function startAiSdkDevtools() {
  const rpc = newHttpBatchRpcSession<BetterDevApi>(RPC_URL);
  return rpc.startAiSdkDevtools();
}

const root = document.getElementById("root");
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <DevtoolPanel
        fallbackCommand="pnpx @ai-sdk/devtools"
        startDevtools={startAiSdkDevtools}
      />
    </React.StrictMode>
  );
}
