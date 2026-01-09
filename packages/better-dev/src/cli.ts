#!/usr/bin/env node

// https://alchemy.run/telemetry/#how-to-opt-out
process.env.ALCHEMY_TELEMETRY_DISABLED = "1";

// 1. pnpx alchemy configure
// **Make sure you ADD `access:write` + `dns_records:edit`**
//
// ┌  🧪 Configure Profile
// │
// ◇  Enter profile name
// │  default
// │
// ●  Profile: default
// │
// ●  - cloudflare: Eric Clemmons (0db135ec469e2f216fcea26426f29755)
// │    - Method: oauth
// │    - Scopes: account:read, user:read, workers:write, workers_kv:write, workers_routes:write, workers_scripts:write, workers_tail:read, d1:write, pages:write, zone:read, ssl_certs:write, ai:write, queues:write, pipelines:write, secrets_store:write, containers:write, cloudchamber:write, vectorize:write, connectivity:admin, offline_access
// │
// ◇  Update profile default?
// │  Yes
// │
// ◇  Select a login method
// for Cloudflare
// │  OAuth
// │
// ◇  Customize scopes?
// │  Yes
// │
// ◆  Select scopes
// │  ◼ access:write (See and change Cloudflare Access data such as zones, applications, certificates, device postures, groups, identity providers, login counts, organizations, policies, service tokens, and users)
// │  ◼ dns_records:edit (Grants edit level access to dns records)
// │  ...
//
// 2. pnpx alchemy util create-cloudflare-tunnel

import path from "node:path";
import { newRpcResponse } from "@hono/capnweb";
import { serve } from "@hono/node-server";
import { createNodeWebSocket } from "@hono/node-ws";
import { createOpencode, createOpencodeClient } from "@opencode-ai/sdk";
import alchemy from "alchemy";
import { Tunnel } from "alchemy/cloudflare";
import concurrently from "concurrently";
import { Hono } from "hono";
import { BetterDevRPC } from "./rpc.ts";

const OPENCODE_BASE_URL = "http://127.0.0.1:4096";
const RPC_PORT = 1337;

async function isOpencodeRunning(): Promise<boolean> {
  try {
    const response = await fetch(`${OPENCODE_BASE_URL}/global/health`);
    const data = (await response.json()) as { healthy?: boolean };
    return data.healthy === true;
  } catch {
    return false;
  }
}

async function ensureOpencode() {
  const directory = process.cwd();

  if (await isOpencodeRunning()) {
    console.log("[better-dev] Connected to existing OpenCode server");
    return createOpencodeClient({
      baseUrl: OPENCODE_BASE_URL,
      directory,
      throwOnError: true,
    });
  }

  console.log("[better-dev] Starting OpenCode server...");
  await createOpencode({
    hostname: "127.0.0.1",
    port: 4096,
  });

  return createOpencodeClient({
    baseUrl: OPENCODE_BASE_URL,
    directory,
    throwOnError: true,
  });
}

function startRpcServer(
  opencodeClient: Awaited<ReturnType<typeof createOpencodeClient>>
) {
  const directory = process.cwd();
  const app = new Hono();
  const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

  app.all("/rpc", (c) => {
    return newRpcResponse(c, new BetterDevRPC(opencodeClient, directory), {
      upgradeWebSocket,
    });
  });

  const server = serve({
    fetch: app.fetch,
    port: RPC_PORT,
  });

  injectWebSocket(server);
  console.log(
    `[better-dev] RPC server running at http://127.0.0.1:${RPC_PORT}/rpc`
  );

  return server;
}

const alchemyApp = await alchemy("better-dev", {
  local: true,
  password: "change-me",
});

const { token: _token } = await Tunnel("tunnel", {
  adopt: true,
  ingress: [
    { hostname: "chat.ericclemmons.com", service: "http://localhost:4096" },
    { hostname: "local.ericclemmons.com", service: "http://localhost:5173" },
    { service: "http_status:404" },
  ],
});

await alchemyApp.finalize();

const opencodeClient = await ensureOpencode();
startRpcServer(opencodeClient);

const command =
  process.argv.slice(Math.max(process.argv.indexOf("--"), 2) + 1).join(" ") ||
  "pnpm dev";

await concurrently(
  [
    { command, name: command, prefixColor: "white" },
    {
      command: "pnpx @ai-sdk/devtools",
      cwd: path.join(process.cwd(), "apps/server"),
      name: "better-dev:@ai-sdk/devtools",
      prefixColor: "whiteBright",
    },
    {
      command: "turbo devtools --no-open",
      name: "better-dev:turbo devtools",
      prefixColor: "magenta",
    },
    // TODO: This needs to be gated behind OAuth or something
    // {
    //   command: `cloudflared tunnel run --token=${token.unencrypted}`,
    //   name: "better-dev:cloudflared",
    //   prefixColor: "#F38020",
    // },
  ],
  {
    killOthersOn: ["failure"],
  }
).result.catch(() => {
  // noop
});
