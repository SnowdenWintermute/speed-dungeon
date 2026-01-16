import { ClientIntent } from "../packets/client-intents.js";
import { GameStateUpdate } from "../packets/game-state-updates.js";
import { ConnectionEndpoint } from "../transport/connection-endpoint.js";
import { TransportDisconnectReason } from "../transport/disconnect-reasons.js";
import { GameServerClientIntentHandlers } from "./game-server/create-game-server-client-intent-handlers.js";
import { LobbyClientIntentHandlers } from "./lobby-server/create-lobby-client-intent-handlers.js";
import { UserSessionRegistry } from "./sessions/user-session-registry.js";
import { UserSession } from "./sessions/user-session.js";
import { MessageDispatchType } from "./update-delivery/message-dispatch-factory.js";
import { OutgoingMessageGateway } from "./update-delivery/message-gateway.js";
import { MessageDispatchOutbox } from "./update-delivery/outbox.js";

export abstract class SpeedDungeonServer {
  protected readonly outgoingMessagesGateway = new OutgoingMessageGateway<
    GameStateUpdate,
    ClientIntent
  >();
  readonly userSessionRegistry = new UserSessionRegistry();

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

        if (handlerOption === undefined) {
          throw new Error("Lobby is not configured to handle this type of ClientIntent");
        }

        const session = this.userSessionRegistry.getExpectedSession(userConnectionEndpoint.id);

        // a workaround is to use "as never" for some reason
        const outbox = await handlerOption(receivable.data as never, session);
        this.dispatchOutboxMessages(outbox);
      },
      async (reason) => {
        console.log("disconnectionHandler in server:", this.name);
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

  protected abstract disconnectionHandler(
    session: UserSession,
    reason: TransportDisconnectReason
  ): Promise<void>;
}
