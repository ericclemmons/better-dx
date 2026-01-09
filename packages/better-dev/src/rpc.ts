import type { OpencodeClient, Session } from "@opencode-ai/sdk";
import { RpcTarget } from "capnweb";

const OPENCODE_BASE_URL = "http://127.0.0.1:4096";

export interface BetterDevApi {
  info(): Promise<{
    baseUrl: string;
    directory: string;
    projectId: string;
    projectUrl: string;
  }>;
  sessionList(): Promise<Session[]>;
}

export class BetterDevRPC extends RpcTarget implements BetterDevApi {
  private readonly client: OpencodeClient;
  private readonly directory: string;

  constructor(client: OpencodeClient, directory: string) {
    super();
    this.client = client;
    this.directory = directory;
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
}
