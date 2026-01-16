import { ConnectionId } from "../aliases.js";
import { IdGenerator } from "../utility-classes/index.js";
import { ConnectionIdentityResolutionContext } from "../servers/services/identity-provider.js";
import { InMemoryConnectionEndpointManager } from "./in-memory-connection-endpoint-manager.js";
import { UntypedInMemoryConnectionEndpoint } from "./in-memory-connection-endpoint.js";

export class InMemoryTransport {
  private readonly idGenerator = new IdGenerator({ saveHistory: false });
  private readonly serverConnectionEndpointManager = new InMemoryConnectionEndpointManager();

  private readonly clientConnectionEndpointManager = new InMemoryConnectionEndpointManager();

  async createConnection(identityContext: ConnectionIdentityResolutionContext) {
    const id = this.idGenerator.generate() as ConnectionId;

    const serverEndpoint = new UntypedInMemoryConnectionEndpoint(
      id,
      (update) => clientEndpoint.receive(update),
      async () => {
        this.serverConnectionEndpointManager.disconnect(id);
        this.clientConnectionEndpointManager.disconnect(id);
      }
    );

    const clientEndpoint = new UntypedInMemoryConnectionEndpoint(
      id,
      (intent) => serverEndpoint.receive(intent),
      async () => {
        this.serverConnectionEndpointManager.disconnect(id);
        this.clientConnectionEndpointManager.disconnect(id);
      }
    );

    return {
      serverEndpoint,
      clientEndpoint,
      open: async () => {
        await this.serverConnectionEndpointManager.onNewConnection(serverEndpoint, identityContext);
        await this.clientConnectionEndpointManager.onNewConnection(serverEndpoint, identityContext);
      },
    };
  }

  getServerConnectionEndpointManager() {
    return this.serverConnectionEndpointManager;
  }

  getClientConnectionEndpointManager() {
    return this.clientConnectionEndpointManager;
  }
}
