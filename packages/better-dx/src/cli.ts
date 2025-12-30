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

function spawnProcess(
  command: string,
  args: string[],
  options: { cwd?: string; name: string }
) {
  const childProcess = spawn(command, args, {
    cwd: options.cwd ?? process.cwd(),
    stdio: ["inherit", "pipe", "pipe"],
    env: {
      ...process.env,
      FORCE_COLOR: "1",
    },
  });

  childProcess.stdout?.on("data", (data: Buffer) => {
    const text = data.toString();
    process.stdout.write(text);

    broadcast({
      type: "stdout",
      data: text,
      timestamp: Date.now(),
    });
  });

  childProcess.stderr?.on("data", (data: Buffer) => {
    const text = data.toString();
    process.stderr.write(text);

    broadcast({
      type: "stderr",
      data: text,
      timestamp: Date.now(),
    });
  });

  childProcess.on("exit", (code) => {
    broadcast({
      type: "system",
      data: `${options.name} exited with code ${code}`,
      timestamp: Date.now(),
    });
  });

  return childProcess;
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

  const processes: Array<{ name: string; process: ReturnType<typeof spawn> }> =
    [];

  const cleanup = () => {
    log("Shutting down...");
    for (const { name, process: proc } of processes) {
      log(`Killing ${name}...`);
      proc.kill();
    }
    server.close();
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  // Run WXT commands
  if (command === "dev" || command === "build" || command === "zip") {
    if (command === "dev") {
      // Start pnpm dev (which runs turbo and handles workspace dev scripts + opencode)
      const workspaceRoot = join(PACKAGE_ROOT, "../..");
      log(`Running: ${packageManager} dev`);
      const pnpmProcess = spawnProcess(packageManager, ["dev"], {
        cwd: workspaceRoot,
        name: `${packageManager} dev`,
      });
      processes.push({ name: `${packageManager} dev`, process: pnpmProcess });

      // Start wxt dev separately (not part of turbo)
      log(`Running: wxt dev ${args.join(" ")}`);
      const wxtProcess = spawnProcess(
        packageManager,
        ["exec", "wxt", "dev", ...args],
        {
          cwd: PACKAGE_ROOT,
          name: "wxt dev",
        }
      );
      processes.push({ name: "wxt dev", process: wxtProcess });
    } else {
      // For build/zip, just run wxt
      log(`Running: wxt ${command} ${args.join(" ")}`);
      const wxtProcess = spawnProcess(
        packageManager,
        ["exec", "wxt", command, ...args],
        {
          cwd: PACKAGE_ROOT,
          name: `wxt ${command}`,
        }
      );
      processes.push({ name: `wxt ${command}`, process: wxtProcess });

      wxtProcess.on("exit", () => {
        cleanup();
      });
    }
  } else {
    // Fallback to running package manager script
    const script = command ?? "dev";
    log(`Running: ${packageManager} ${script} ${args.join(" ")}`);

    const devProcess = spawnProcess(packageManager, [script, ...args], {
      name: `${packageManager} ${script}`,
    });
    processes.push({
      name: `${packageManager} ${script}`,
      process: devProcess,
    });

    devProcess.on("exit", () => {
      cleanup();
    });
  }
}

main();
