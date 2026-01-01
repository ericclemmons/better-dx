#!/usr/bin/env node
import { spawn } from "node:child_process";
import { serve } from "@hono/node-server";
import { broadcast, createServer } from "./server.ts";

const SERVER_PORT = 1337;

function log(message: string) {
  console.log(`[better-dx] ${message}`);
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
  // Skip '--' separator if present
  let commandIndex = 2;
  if (process.argv[commandIndex] === "--") {
    commandIndex = 3;
  }

  const command = process.argv[commandIndex];
  const args = process.argv.slice(commandIndex + 1);

  if (!command) {
    log("No command provided");
    process.exit(1);
  }

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

  // Spawn the provided command
  const commandString = [command, ...args].join(" ");
  log(`Running: ${commandString}`);

  const childProcess = spawnProcess(command, args, {
    name: commandString,
  });
  processes.push({
    name: commandString,
    process: childProcess,
  });

  childProcess.on("exit", () => {
    cleanup();
  });
}

main();
