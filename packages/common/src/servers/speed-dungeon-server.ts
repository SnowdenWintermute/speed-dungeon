import { ClientIntent } from "../packets/client-intents.js";
import { GameStateUpdate } from "../packets/game-state-updates.js";
import { ConnectionEndpoint } from "../transport/connection-endpoint.js";
import { TransportDisconnectReason } from "../transport/disconnect-reasons.js";
import { BasicRandomNumberGenerator } from "../utility-classes/randomizers.js";
import { invariant } from "../utils/index.js";
import { GameServerClientIntentHandlers } from "./game-server/create-game-server-client-intent-handlers.js";
import { IncomingConnectionGateway } from "./incoming-connection-gateway.js";
import { LobbyClientIntentHandlers } from "./lobby-server/create-lobby-client-intent-handlers.js";
import { ConnectionIdentityResolutionContext } from "./services/identity-provider.js";
import { UserSessionRegistry } from "./sessions/user-session-registry.js";
import { UserSession } from "./sessions/user-session.js";
import {
  MessageDispatchFactory,
  MessageDispatchType,
} from "./update-delivery/message-dispatch-factory.js";
import { OutgoingMessageGateway } from "./update-delivery/message-gateway.js";
import { MessageDispatchOutbox } from "./update-delivery/outbox.js";

export abstract class SpeedDungeonServer {
  protected readonly outgoingMessagesGateway = new OutgoingMessageGateway<GameStateUpdate>();
  readonly userSessionRegistry = new UserSessionRegistry();
  protected readonly updateDispatchFactory = new MessageDispatchFactory<GameStateUpdate>(
    this.userSessionRegistry
  );

  protected readonly randomNumberGenerator = new BasicRandomNumberGenerator();

  constructor(
    readonly name: string,
    protected readonly incomingConnectionGateway: IncomingConnectionGateway
  ) {}

  closeTransportServer() {
    this.incomingConnectionGateway.close();
  }

  private parseMessage(rawData: string | ArrayBuffer | Buffer<ArrayBufferLike>) {
    // Convert to string
    let messageStr: string;
    if (typeof rawData === "string") {
      messageStr = rawData;
    } else if (rawData instanceof Buffer) {
      messageStr = rawData.toString("utf8");
    } else if (rawData instanceof ArrayBuffer) {
      messageStr = new TextDecoder().decode(rawData);
    } else {
      throw new Error("Unknown message type");
    }

    const parsed = JSON.parse(messageStr) as ClientIntent;
    return parsed;
  }

  protected attachIntentHandlersToSessionConnection(
    session: UserSession,
    userConnectionEndpoint: ConnectionEndpoint,
    intentHandlers: Partial<GameServerClientIntentHandlers> | Partial<LobbyClientIntentHandlers>
  ) {
    // attach the connection to message handlers and disconnectionHandler
    userConnectionEndpoint.on("message", async (rawData) => {
      const parsed = this.parseMessage(rawData);

      const handlerOption = intentHandlers[parsed.type];

      invariant(
        handlerOption !== undefined,
        "Server is not configured to handle this type of message"
      );

      const session = this.userSessionRegistry.getExpectedSession(userConnectionEndpoint.id);

      // TS asks: what argument would be valid for *any* possible handler?
      // Because this is a union of handlers, the parameter type becomes the
      // intersection of all payload types, which collapses to `never`.
      // Since we look up handler in a typed record and check it is not undefined
      // we can say the data is the correct type for the handler
      const outbox = await handlerOption(parsed.data as never, session);
      this.dispatchOutboxMessages(outbox);
    });
    userConnectionEndpoint.on("close", async (reason) => {
      this.disconnectionHandler(session, reason);
    });
  }

  protected dispatchOutboxMessages(outbox: MessageDispatchOutbox<GameStateUpdate>) {
    for (const dispatch of outbox.toDispatches()) {
      switch (dispatch.type) {
        case MessageDispatchType.Single:
          this.outgoingMessagesGateway.submitToConnection(dispatch.connectionId, dispatch.message);
          break;
        case MessageDispatchType.FanOut:
          this.outgoingMessagesGateway.submitToConnections(
            dispatch.connectionIds,
            dispatch.message
          );
          break;
      }
    }
  }

  protected abstract handleConnection(
    connectionEndpoint: ConnectionEndpoint,
    identityResolutionContext: ConnectionIdentityResolutionContext
  ): Promise<void>;

  protected abstract disconnectionHandler(
    session: UserSession,
    reason: TransportDisconnectReason | number
  ): Promise<void>;
}
