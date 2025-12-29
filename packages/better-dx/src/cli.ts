#!/usr/bin/env node
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { serve } from "@hono/node-server";
import { broadcast, createServer } from "./server.ts";

const SERVER_PORT = 1337;
const __dirname = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = join(__dirname, "..");

function log(message: string) {
  console.log(`[better-dx] ${message}`);
}

function parsePackageManagerFromField(pm: string): string | null {
  if (pm.startsWith("pnpm@")) {
    return "pnpm";
  }
  if (pm.startsWith("yarn@")) {
    return "yarn";
  }
  if (pm.startsWith("npm@")) {
    return "npm";
  }
  if (pm.startsWith("bun@")) {
    return "bun";
  }
  return null;
}

function detectFromLockFiles(root: string): string | null {
  if (existsSync(join(root, "pnpm-lock.yaml"))) {
    return "pnpm";
  }
  if (existsSync(join(root, "yarn.lock"))) {
    return "yarn";
  }
  if (existsSync(join(root, "package-lock.json"))) {
    return "npm";
  }
  if (existsSync(join(root, "bun.lockb"))) {
    return "bun";
  }
  return null;
}

function detectPackageManager(): string {
  // Check for packageManager field in package.json
  try {
    const packageJson = JSON.parse(
      readFileSync(join(PACKAGE_ROOT, "package.json"), "utf-8")
    ) as {
      packageManager?: string;
    };
    if (packageJson.packageManager) {
      const pm = parsePackageManagerFromField(packageJson.packageManager);
      if (pm) {
        return pm;
      }
    }
  } catch {
    // Ignore errors
  }

  // Check for lock files in package root
  const packagePm = detectFromLockFiles(PACKAGE_ROOT);
  if (packagePm) {
    return packagePm;
  }

  // Check for lock files in workspace root
  const workspaceRoot = join(PACKAGE_ROOT, "../..");
  const workspacePm = detectFromLockFiles(workspaceRoot);
  if (workspacePm) {
    return workspacePm;
  }

  // Default to pnpm
  return "pnpm";
}

function main() {
  const command = process.argv[2];
  const args = process.argv.slice(3);
  const packageManager = detectPackageManager();

  // Start the dashboard server
  const app = createServer();
  const server = serve({
    fetch: app.fetch,
    port: SERVER_PORT,
  });

  log(`Dashboard: http://localhost:${SERVER_PORT}`);

  broadcast({
    type: "system",
    data: "better-dx started",
    timestamp: Date.now(),
  });

  // Run WXT commands
  if (command === "dev" || command === "build" || command === "zip") {
    log(`Running: wxt ${command} ${args.join(" ")}`);

    // Use pnpm exec to find wxt in node_modules
    const wxtProcess = spawn(
      packageManager,
      ["exec", "wxt", command, ...args],
      {
        cwd: PACKAGE_ROOT,
        stdio: ["inherit", "pipe", "pipe"],
        env: {
          ...process.env,
          FORCE_COLOR: "1",
        },
      }
    );

    wxtProcess.stdout?.on("data", (data: Buffer) => {
      const text = data.toString();
      process.stdout.write(text);

      broadcast({
        type: "stdout",
        data: text,
        timestamp: Date.now(),
      });
    });

    wxtProcess.stderr?.on("data", (data: Buffer) => {
      const text = data.toString();
      process.stderr.write(text);

      broadcast({
        type: "stderr",
        data: text,
        timestamp: Date.now(),
      });
    });

    wxtProcess.on("exit", (code) => {
      broadcast({
        type: "system",
        data: `wxt ${command} exited with code ${code}`,
        timestamp: Date.now(),
      });
      cleanup();
    });

    const cleanup = () => {
      log("Shutting down...");
      wxtProcess.kill();
      server.close();
      process.exit(0);
    };

    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);
  } else {
    // Fallback to running package manager script
    const script = command ?? "dev";
    log(`Running: ${packageManager} ${script} ${args.join(" ")}`);

    const devProcess = spawn(packageManager, [script, ...args], {
      stdio: ["inherit", "pipe", "pipe"],
      env: {
        ...process.env,
        FORCE_COLOR: "1",
      },
    });

    devProcess.stdout?.on("data", (data: Buffer) => {
      const text = data.toString();
      process.stdout.write(text);

      broadcast({
        type: "stdout",
        data: text,
        timestamp: Date.now(),
      });
    });

    devProcess.stderr?.on("data", (data: Buffer) => {
      const text = data.toString();
      process.stderr.write(text);

      broadcast({
        type: "stderr",
        data: text,
        timestamp: Date.now(),
      });
    });

    devProcess.on("exit", (code) => {
      broadcast({
        type: "system",
        data: `${packageManager} ${script} exited with code ${code}`,
        timestamp: Date.now(),
      });
      cleanup();
    });

    const cleanup = () => {
      log("Shutting down...");
      devProcess.kill();
      server.close();
      process.exit(0);
    };

    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);
  }
}

main();
