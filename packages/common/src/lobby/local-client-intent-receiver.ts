import { ConnectionId } from "../aliases.js";
import { ClientIntent, ClientIntentType } from "../packets/client-intents.js";
import { GameStateUpdate } from "../packets/game-state-updates.js";
import { IdGenerator } from "../utility-classes/index.js";
import { ClientIntentReceiver } from "./client-intent-receiver.js";
import {
  LocalTransportEndpoint,
  TransportDisconnectReason,
  TransportDisconnectReasonType,
} from "./update-delivery/transport-endpoint.js";

export class LocalConnectionFactory {
  private idGenerator = new IdGenerator({ saveHistory: false });

  constructor(
    private serverConnectionManager: LocalConnectionEndpointManager<GameStateUpdate, ClientIntent>,
    private clientConnectionManager: LocalConnectionEndpointManager<ClientIntent, GameStateUpdate>
  ) {}

  create() {
    const id = this.idGenerator.generate() as ConnectionId;

    const serverEndpoint = new LocalTransportEndpoint<GameStateUpdate, ClientIntent>(
      id,
      (update) => clientEndpoint.receive(update),
      () =>
        this.serverConnectionManager.disconnect(
          id,
          new TransportDisconnectReason(TransportDisconnectReasonType.TransportClose)
        )
    );

    this.serverConnectionManager.onNewConnection(serverEndpoint);

    const clientEndpoint = new LocalTransportEndpoint<ClientIntent, GameStateUpdate>(
      id,
      (intent) => serverEndpoint.receive(intent),
      () =>
        this.clientConnectionManager.disconnect(
          id,
          new TransportDisconnectReason(TransportDisconnectReasonType.TransportClose)
        )
    );

    return { serverEndpoint, clientEndpoint };
  }
}

export class LocalConnectionEndpointManager<
  Sendable,
  Receivable extends { type: PropertyKey; data: unknown },
> {
  private connections = new Map<ConnectionId, LocalTransportEndpoint<Sendable, Receivable>>();
  private handleNewConnection: (
    transportEndpoint: LocalTransportEndpoint<Sendable, Receivable>
  ) => void = () => {
    throw new Error("not initialized");
  };

  setNewConnectionHandler(
    handler: (transportEndpoint: LocalTransportEndpoint<Sendable, Receivable>) => void
  ) {
    this.handleNewConnection = handler;
  }

  onNewConnection(transportEndpoint: LocalTransportEndpoint<Sendable, Receivable>): void {
    this.connections.set(transportEndpoint.id, transportEndpoint);
    this.handleNewConnection(transportEndpoint);
  }

  disconnect(id: ConnectionId, reason: TransportDisconnectReason) {
    const connection = this.connections.get(id);
    if (connection) {
      this.connections.delete(id);
    }
  }
}

export class LobbyLocalClientIntentReceiver extends ClientIntentReceiver {
  constructor(
    private localServerConnectionEndpointManager: LocalConnectionEndpointManager<
      GameStateUpdate,
      ClientIntent
    >
  ) {
    super();
  }

  listen() {
    this.localServerConnectionEndpointManager.setNewConnectionHandler((connection) => {
      console.log("connection:", connection.id);
      connection.subscribe(ClientIntentType.JoinGame, (data) => {
        const intent: ClientIntent = { type: ClientIntentType.JoinGame, data };
        this.dispatchIntent(intent, connection.id);
      });

      connection.subscribe(ClientIntentType.Disconnection, (data) => {
        this.dispatchIntent({ type: ClientIntentType.Disconnection, data }, connection.id);
      });
    });
  }
}

// this.io.of("/").on("connection", async (socket) => {
//   console.log("remote lobby is listening");
//   const transportEndpoint = new SocketTransportEndpoint(socket);
//   const req = socket.request;
//   const cookies = req.headers.cookie;
//   this.handleConnection(transportEndpoint, { cookies });
//   socket.on(ClientToServerEvent.ClientIntent, (clientIntent) => {
//     this.dispatchIntent(clientIntent, socket.id as ConnectionId);
//   });
//   socket.on("disconnect", (reason) => {
//     this.dispatchIntent(
//       {
//         type: ClientIntentType.Disconnection,
//         data: { reason: new TransportDisconnectReason(SOCKET_IO_DISCONNECT_REASONS[reason]) },
//       },
//       socket.id as ConnectionId
//     );
//   });
// });
