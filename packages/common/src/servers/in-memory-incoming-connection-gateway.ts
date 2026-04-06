import { IncomingConnectionGateway } from "./incoming-connection-gateway.js";
import { InMemoryConnectionEndpointServer } from "../transport/in-memory-connection-endpoint-server.js";

export class InMemoryIncomingConnectionGateway extends IncomingConnectionGateway {
  constructor(private inMemoryConnectionEndpointServer: InMemoryConnectionEndpointServer) {
    super();
  }

  close() {
    return new Promise<void>((resolve, reject) =>
      this.inMemoryConnectionEndpointServer.close((err) => (err ? reject(err) : resolve()))
    );
  }

  listen() {
    this.inMemoryConnectionEndpointServer.on("connection", async (untypedEndpoint, request) => {
      const identityContext = this.parseConnectionIdentityContext(request);
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
