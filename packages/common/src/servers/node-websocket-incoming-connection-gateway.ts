import { WebSocketServer } from "ws";
import { IncomingConnectionGateway } from "./incoming-connection-gateway.js";
import { NodeWebSocketConnectionEndpoint } from "../transport/node-websocket-connection-endpoint.js";

export class NodeWebSocketIncomingConnectionGateway extends IncomingConnectionGateway {
  constructor(private wss: WebSocketServer) {
    super();
  }

  close() {
    this.wss.close();
  }

  listen() {
    this.wss.on("connection", async (socket, request) => {
      const identityContext = this.parseConnectionIdentityContext(request);

      const untypedEndpoint = new NodeWebSocketConnectionEndpoint(socket, this.issueConnectionId());
      await this.requireConnectionHandler()(untypedEndpoint, identityContext);
    });
  }
}
