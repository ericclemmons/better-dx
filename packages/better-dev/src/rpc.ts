import { existsSync } from "node:fs";
import { join } from "node:path";
import type { OpencodeClient, Session } from "@opencode-ai/sdk";
import { RpcTarget } from "capnweb";
import type { ProcessManager } from "./process-manager.ts";

const OPENCODE_BASE_URL = "http://127.0.0.1:4096";
const AI_DEVTOOLS_PORT = 4983;
const TURBO_DEVTOOLS_PORT = 9876;

export interface SessionCreateParams {
  prompt: string;
  sourcePath?: string;
  screenshot?: string;
}

export interface DevtoolsResult {
  url: string;
  ready: boolean;
}

export class BetterDevRPC extends RpcTarget {
  private readonly client: OpencodeClient;
  private readonly directory: string;
  private readonly processManager: ProcessManager;

  constructor(
    client: OpencodeClient,
    directory: string,
    processManager: ProcessManager
  ) {
    super();
    this.client = client;
    this.directory = directory;
    this.processManager = processManager;
  }

  info() {
    const projectId = Buffer.from(this.directory, "utf8").toString("base64url");
    const projectUrl = `${OPENCODE_BASE_URL}/${projectId}/session`;

    return Promise.resolve({
      baseUrl: OPENCODE_BASE_URL,
      directory: this.directory,
      projectId,
      projectUrl,
    });
  }

  async sessionList(): Promise<Session[]> {
    const result = await this.client.session.list();
    return result.data ?? [];
  }

  async sessionCreate(
    params: SessionCreateParams
  ): Promise<{ sessionId: string }> {
    const sessionResult = await this.client.session.create({
      body: {
        title: params.sourcePath ? `Edit: ${params.sourcePath}` : "UI Edit",
      },
    });

    if (!sessionResult.data) {
      throw new Error("Failed to create session");
    }

    const sessionId = sessionResult.data.id;

    interface TextPart {
      type: "text";
      text: string;
    }
    interface FilePart {
      type: "file";
      mime: string;
      url: string;
      filename?: string;
    }
    const parts: Array<TextPart | FilePart> = [
      { type: "text", text: params.prompt },
    ];

    if (params.screenshot) {
      parts.push({
        type: "file",
        mime: "image/png",
        url: params.screenshot,
        filename: "screenshot.png",
      });
    }

    await this.client.session.prompt({
      path: { id: sessionId },
      body: { parts },
    });

    return { sessionId };
  }

  async openInEditor(path: string): Promise<{ success: boolean }> {
    const launch = (await import("launch-editor")).default;
    return new Promise((resolve) => {
      const filePath = path.replaceAll("$", "\\$");
      launch(filePath, undefined, (_filename, err) => {
        if (err) {
          console.warn(`[better-dev] Failed to open ${path} in editor:`, err);
          resolve({ success: false });
        } else {
          resolve({ success: true });
        }
      });
    });
  }

  async startAiSdkDevtools(): Promise<DevtoolsResult> {
    const url = `http://localhost:${AI_DEVTOOLS_PORT}`;

    if (this.processManager.isRunning("ai-devtools")) {
      const ready = await this.#waitForServer(url);
      return { url, ready };
    }

    const cwd = this.#findPackageWithDep("@ai-sdk/devtools");
    if (!cwd) {
      throw new Error(
        "No package with @ai-sdk/devtools found. Install it in a workspace package."
      );
    }

    await this.processManager.start("pnpx @ai-sdk/devtools", {
      name: "ai-devtools",
      cwd,
    });

    const ready = await this.#waitForServer(url);
    return { url, ready };
  }

  async startTurboDevtools(): Promise<DevtoolsResult> {
    const url = `https://turborepo.dev/devtools?port=${TURBO_DEVTOOLS_PORT}`;
    const healthUrl = `http://localhost:${TURBO_DEVTOOLS_PORT}`;

    if (this.processManager.isRunning("turbo-devtools")) {
      const ready = await this.#waitForServer(healthUrl);
      return { url, ready };
    }

    if (!existsSync(join(this.directory, "turbo.json"))) {
      throw new Error(
        "No turbo.json found. This project doesn't use Turborepo."
      );
    }

    await this.processManager.start("turbo devtools --no-open", {
      name: "turbo-devtools",
      cwd: this.directory,
    });

    const ready = await this.#waitForServer(healthUrl);
    return { url, ready };
  }

  #findPackageWithDep(dep: string): string | null {
    const searchPaths = [
      join(this.directory, "apps"),
      join(this.directory, "packages"),
      this.directory,
    ];

    for (const basePath of searchPaths) {
      if (!existsSync(basePath)) continue;

      const { readdirSync, readFileSync } = require("node:fs");
      const entries = readdirSync(basePath, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        const pkgPath = join(basePath, entry.name, "package.json");
        if (!existsSync(pkgPath)) continue;

        try {
          const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
          const allDeps = {
            ...pkg.dependencies,
            ...pkg.devDependencies,
          };
          if (allDeps[dep]) {
            return join(basePath, entry.name);
          }
        } catch {}
      }
    }

    return null;
  }

  async #waitForServer(url: string, maxAttempts = 30): Promise<boolean> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        await fetch(url);
        return true;
      } catch {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
    return false;
  }
}
