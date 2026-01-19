import { ClientIntent } from "../packets/client-intents.js";
import { GameStateUpdate } from "../packets/game-state-updates.js";
import { ConnectionEndpoint, UntypedConnectionEndpoint } from "../transport/connection-endpoint.js";
import { TransportDisconnectReason } from "../transport/disconnect-reasons.js";
import { BasicRandomNumberGenerator } from "../utility-classes/randomizers.js";
import { invariant } from "../utils/index.js";
import { GameServerClientIntentHandlers } from "./game-server/create-game-server-client-intent-handlers.js";
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
  protected readonly outgoingMessagesGateway = new OutgoingMessageGateway<
    GameStateUpdate,
    ClientIntent
  >();
  readonly userSessionRegistry = new UserSessionRegistry();
  protected readonly updateDispatchFactory = new MessageDispatchFactory<GameStateUpdate>(
    this.userSessionRegistry
  );

  protected readonly randomNumberGenerator = new BasicRandomNumberGenerator();

  constructor(readonly name: string) {}

  protected attachIntentHandlersToSessionConnection(
    session: UserSession,
    userConnectionEndpoint: ConnectionEndpoint<GameStateUpdate, ClientIntent>,
    intentHandlers: Partial<GameServerClientIntentHandlers> | Partial<LobbyClientIntentHandlers>
  ) {
    console.log(
      "attaching connection handlers to",
      userConnectionEndpoint.id,
      " for server:",
      this.name
    );
    // attach the connection to message handlers and disconnectionHandler
    userConnectionEndpoint.subscribeAll(
      async (receivable) => {
        const handlerOption = intentHandlers[receivable.type];

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
        const outbox = await handlerOption(receivable.data as never, session);
        this.dispatchOutboxMessages(outbox);
      },
      async (reason) => {
        this.disconnectionHandler(session, reason);
      }
    );
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
    connectionEndpoint: UntypedConnectionEndpoint,
    identityResolutionContext: ConnectionIdentityResolutionContext
  ): Promise<void>;

  protected abstract disconnectionHandler(
    session: UserSession,
    reason: TransportDisconnectReason
  ): Promise<void>;
}
