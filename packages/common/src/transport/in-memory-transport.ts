import { ConnectionId } from "../aliases.js";
import { IdGenerator } from "../utility-classes/index.js";
import { ConnectionIdentityResolutionContext } from "../servers/services/identity-provider.js";
import { InMemoryConnectionEndpointManager } from "./in-memory-connection-endpoint-manager.js";
import { UntypedInMemoryConnectionEndpoint } from "./in-memory-connection-endpoint.js";
import { TransportDisconnectReason, TransportDisconnectReasonType } from "./disconnect-reasons.js";

export class InMemoryTransport {
  private readonly idGenerator = new IdGenerator({ saveHistory: false });
  private readonly serverConnectionEndpointManager = new InMemoryConnectionEndpointManager();

  private readonly clientConnectionEndpointManager = new InMemoryConnectionEndpointManager();

  async createConnection(identityContext: ConnectionIdentityResolutionContext) {
    const id = this.idGenerator.generate() as ConnectionId;

    const serverEndpoint = new UntypedInMemoryConnectionEndpoint(
      id,
      (update) => clientEndpoint.receive(update),
      () =>
        this.serverConnectionEndpointManager.disconnect(
          id,
          new TransportDisconnectReason(TransportDisconnectReasonType.TransportClose)
        )
    );

    const clientEndpoint = new UntypedInMemoryConnectionEndpoint(
      id,
      (intent) => serverEndpoint.receive(intent),
      () =>
        this.clientConnectionEndpointManager.disconnect(
          id,
          new TransportDisconnectReason(TransportDisconnectReasonType.TransportClose)
        )
    );

    await this.serverConnectionEndpointManager.onNewConnection(serverEndpoint, identityContext);

    return { serverEndpoint, clientEndpoint };
  }

  getServerConnectionEndpointManager() {
    return this.serverConnectionEndpointManager;
  }

  getClientConnectionEndpointManager() {
    return this.clientConnectionEndpointManager;
  }
}
