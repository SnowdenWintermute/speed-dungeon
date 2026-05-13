import { IncomingConnectionGateway } from "@speed-dungeon/common";
import { WebSocketServer } from "ws";
import { NodeWebSocketConnectionEndpoint } from "../transport/node-websocket-connection-endpoint.js";

export class NodeWebSocketIncomingConnectionGateway extends IncomingConnectionGateway {
  constructor(private wss: WebSocketServer) {
    super();
  }

  close() {
    return new Promise<void>((resolve, reject) => {
      for (const client of this.wss.clients) {
        client.terminate();
      }
      this.wss.close((err) => (err ? reject(err) : resolve()));
    });
  }

  listen() {
    this.wss.on("connection", async (socket, request) => {
      const identityContext = this.parseConnectionIdentityContext(request);

      const untypedEndpoint = new NodeWebSocketConnectionEndpoint(socket, this.issueConnectionId());
      try {
        await this.requireConnectionHandler()(untypedEndpoint, identityContext);
      } catch (error) {
        if (error instanceof Error) {
          // console.info("error with attempted connection:", error.message);
        } else {
          console.trace(error);
        }

        untypedEndpoint.close();
      }
    });
  }
}
