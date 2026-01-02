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
import alchemy from "alchemy";
import { Tunnel } from "alchemy/cloudflare";
import concurrently from "concurrently";

const app = await alchemy("better-dev", { local: true, password: "change-me" });

const { token } = await Tunnel("tunnel", {
  adopt: true,
  ingress: [
    { hostname: "chat.ericclemmons.com", service: "http://localhost:4096" },
    { hostname: "local.ericclemmons.com", service: "http://localhost:5173" },
    { service: "http_status:404" },
  ],
});

await app.finalize();

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
    {
      command: "pnpx opencode-ai@dev --port 4096 serve",
      name: "better-dev:opencode",
      prefixColor: "gray",
    },
    {
      command: `cloudflared tunnel run --token ${token.unencrypted}`,
      name: "better-dev:cloudflared",
      prefixColor: "#F38020",
    },
  ],
  {
    killOthersOn: ["failure"],
  }
).result.catch(() => {
  // noop
});
