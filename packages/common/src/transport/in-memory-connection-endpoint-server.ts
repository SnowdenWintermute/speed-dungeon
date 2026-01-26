import { EventEmitter } from "events";
import { InMemoryConnectionEndpoint } from "./in-memory-connection-endpoint.js";
import { ConnectionId } from "../aliases.js";
import { v4 as uuidv4 } from "uuid";
import { IncomingMessage } from "http";

export interface InMemoryConnectionRequest {
  url: string;
  headers: Record<string, string | undefined>;
  method?: string;
}

/** events emitted asynchronously like real WebSocketServer */
export class InMemoryConnectionEndpointServer extends EventEmitter {
  private clients = new Set<InMemoryConnectionEndpoint>();
  private listening = false;

  constructor() {
    super();

    queueMicrotask(() => {
      this.listening = true;
      this.emit("listening");
    });
  }

  private issueConnectionId() {
    return uuidv4() as ConnectionId;
  }

  // Called when a client wants to connect
  acceptConnection(
    clientEndpoint: InMemoryConnectionEndpoint,
    request: InMemoryConnectionRequest
  ): void {
    const serverEndpoint = new InMemoryConnectionEndpoint(this.issueConnectionId()); // skip auto-open

    // Link the two endpoints as peers
    clientEndpoint.setPeer(serverEndpoint);
    serverEndpoint.setPeer(clientEndpoint);

    this.clients.add(serverEndpoint);

    // Emit connection event, then open both endpoints asynchronously
    queueMicrotask(() => {
      this.emit("connection", serverEndpoint, request);
    });

    // Clean up when server endpoint closes
    serverEndpoint.once("close", () => {
      this.clients.delete(serverEndpoint);
    });
  }

  close(callback?: (err?: Error) => void): void {
    this.clients.forEach((client) => client.close());
    this.clients.clear();
    this.listening = false;
    queueMicrotask(() => callback?.());
  }

  // Match ws.WebSocketServer interface
  on(
    event: "connection",
    listener: (
      endpoint: InMemoryConnectionEndpoint,
      request: IncomingMessage | InMemoryConnectionRequest
    ) => void
  ): this;
  on(event: "listening", listener: () => void): this;
  on(event: "error", listener: (error: Error) => void): this;
  on(event: string, listener: (...args: any[]) => void): this {
    return super.on(event, listener);
  }
}
