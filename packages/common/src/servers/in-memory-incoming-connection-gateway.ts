import { IncomingConnectionGateway } from "./incoming-connection-gateway.js";
import { InMemoryConnectionEndpointServer } from "../transport/in-memory-connection-endpoint-server.js";

export class InMemoryIncomingConnectionGateway extends IncomingConnectionGateway {
  constructor(private inMemoryConnectionEndpointServer: InMemoryConnectionEndpointServer) {
    super();
  }

  close() {
    this.inMemoryConnectionEndpointServer.close();
  }

  listen() {
    this.inMemoryConnectionEndpointServer.on("connection", async (untypedEndpoint, request) => {
      const identityContext = this.parseConnectionIdentityContext(request);
      await this.requireConnectionHandler()(untypedEndpoint, identityContext);
    });
  }
}
