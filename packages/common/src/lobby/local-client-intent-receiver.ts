import { ConnectionId } from "../aliases.js";
import { ClientIntent } from "../packets/client-intents.js";
import { ClientToServerEvent } from "../packets/client-to-server.js";
import { GameStateUpdate, GameStateUpdateHandlers } from "../packets/game-state-updates.js";
import { IdGenerator } from "../utility-classes/index.js";
import { ClientIntentReceiver } from "./client-intent-receiver.js";
import {
  TransportDisconnectReason,
  TransportDisconnectReasonType,
  TransportEndpoint,
} from "./update-delivery/transport-endpoint.js";

export class LocalServerTransportEndpoint implements TransportEndpoint {
  private gameStateUpdateHandlers: Partial<GameStateUpdateHandlers> = {};

  constructor(
    public readonly id: ConnectionId,
    private connectionManager: LocalServerConnectionManager
  ) {}

  // equivalent to socket.emit() on the node server
  send(update: GameStateUpdate): void {
    this.intentHandlers.get(ClientToServerEvent.ServerUpdate)?.forEach((fn) => fn(update));
  }

  // equivalent to socket.on("eventName", handler) on the node server
  on(eventName: string, fn: (update: ClientIntent) => void): void {
    const existing = this.intentHandlers.get(eventName);
    if (!existing) {
      this.intentHandlers.set(eventName, []);
    } else {
      existing.push(fn);
    }
  }

  close(): void {
    this.connectionManager.disconnect(
      this.id,
      new TransportDisconnectReason(TransportDisconnectReasonType.TransportClose)
    );
  }
}

class LocalServerConnectionManager {
  private connections = new Map<ConnectionId, LocalServerTransportEndpoint>();
  private idGenerator = new IdGenerator({ saveHistory: false });

  onNewConnection(
    connectionHandler: (transportEndpoint: LocalServerTransportEndpoint) => void
  ): void {
    const id = this.idGenerator.generate() as ConnectionId;
    const newConnection = new LocalServerTransportEndpoint(id, this);
    this.connections.set(id, newConnection);

    connectionHandler(newConnection);
  }

  disconnect(id: ConnectionId, reason: TransportDisconnectReason) {
    const connection = this.connections.get(id);
    if (connection) {
      this.connections.delete(id);
    }
  }
}

export class LobbyRemoteClientIntentReceiver extends ClientIntentReceiver {
  constructor(private connectionManager: LocalServerConnectionManager) {
    super();
  }

  listen() {
    this.connectionManager.onNewConnection((connection) => {
      connection.on(ClientToServerEvent.ClientIntent, (clientIntent) => {
        this.dispatchIntent(clientIntent, connection.id);
      });
    });
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
  }
}
