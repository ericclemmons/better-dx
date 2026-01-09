import { EventEmitter } from "node:events";
import { execa, type ResultPromise } from "execa";
import treeKill from "tree-kill";

export interface ProcessInfo {
  name: string;
  command: string;
  cwd: string;
  pid: number | undefined;
  startedAt: Date;
}

export interface LogEvent {
  type: "stdout" | "stderr" | "exit";
  data: string;
  timestamp: Date;
  process: string;
}

export interface StartProcessOptions {
  cwd?: string;
  name?: string;
}

export class ProcessManager extends EventEmitter {
  private readonly processes = new Map<
    string,
    {
      subprocess: ResultPromise;
      info: ProcessInfo;
    }
  >();

  async start(
    command: string,
    options: StartProcessOptions = {}
  ): Promise<ProcessInfo> {
    const name = options.name ?? command;
    const cwd = options.cwd ?? process.cwd();

    if (this.processes.has(name)) {
      await this.stop(name);
    }

    const subprocess = execa({
      shell: true,
      cwd,
      stdout: "pipe",
      stderr: "pipe",
      stdin: "inherit",
      cleanup: true,
      detached: false,
      env: {
        ...process.env,
        FORCE_COLOR: "3",
      },
    })`${command}`;

    const info: ProcessInfo = {
      name,
      command,
      cwd,
      pid: subprocess.pid,
      startedAt: new Date(),
    };

    this.processes.set(name, { subprocess, info });

    subprocess.stdout?.on("data", (data: Buffer) => {
      process.stdout.write(data);
      this.emit("log", {
        type: "stdout",
        data: data.toString(),
        timestamp: new Date(),
        process: name,
      } satisfies LogEvent);
    });

    subprocess.stderr?.on("data", (data: Buffer) => {
      process.stderr.write(data);
      this.emit("log", {
        type: "stderr",
        data: data.toString(),
        timestamp: new Date(),
        process: name,
      } satisfies LogEvent);
    });

    subprocess.on("exit", (code: number | null) => {
      this.emit("log", {
        type: "exit",
        data: `Process "${name}" exited with code ${code}`,
        timestamp: new Date(),
        process: name,
      } satisfies LogEvent);
      this.processes.delete(name);
    });

    console.log(`[better-dev] Started "${name}" (PID: ${subprocess.pid})`);
    return info;
  }

  stop(name: string): Promise<boolean> {
    const proc = this.processes.get(name);
    if (!proc) {
      return Promise.resolve(false);
    }

    const { subprocess, info } = proc;

    return new Promise((resolve) => {
      if (!info.pid) {
        this.processes.delete(name);
        resolve(true);
        return;
      }

      treeKill(info.pid, "SIGTERM", (err: Error | undefined) => {
        if (err) {
          console.warn(`[better-dev] Error stopping "${name}":`, err);
          subprocess.kill("SIGKILL");
        }
        this.processes.delete(name);
        console.log(`[better-dev] Stopped "${name}"`);
        resolve(true);
      });
    });
  }

  async stopAll(): Promise<void> {
    const names = Array.from(this.processes.keys());
    await Promise.all(names.map((name) => this.stop(name)));
  }

  list(): ProcessInfo[] {
    return Array.from(this.processes.values()).map((p) => p.info);
  }

  isRunning(name: string): boolean {
    return this.processes.has(name);
  }
}
