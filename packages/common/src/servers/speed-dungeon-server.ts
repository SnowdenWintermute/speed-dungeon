import { ClientIntent } from "../packets/client-intents.js";
import { GameStateUpdate, GameStateUpdateType } from "../packets/game-state-updates.js";
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

/** used to ensure all client intent messages are handled in order of receipt,
 * @PERF - could make this per-game instead of server-wide
 * */
class GlobalIntentExecutor {
  private chain: Promise<void> = Promise.resolve();

  enqueue(work: () => Promise<void>) {
    this.chain = this.chain.then(async () => {
      try {
        await work();
      } catch (error) {
        console.error("unhandled error", error);
      }
    });
  }
}

export abstract class SpeedDungeonServer {
  protected readonly outgoingMessagesGateway = new OutgoingMessageGateway<GameStateUpdate>();
  readonly userSessionRegistry = new UserSessionRegistry();
  protected readonly updateDispatchFactory = new MessageDispatchFactory<GameStateUpdate>(
    this.userSessionRegistry
  );

  protected readonly randomNumberGenerator = new BasicRandomNumberGenerator();

  protected readonly executor = new GlobalIntentExecutor();

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
    userConnectionEndpoint.on("message", (rawData) => {
      this.executor.enqueue(async () => {
        const parsed = this.parseMessage(rawData);

        const handlerOption = intentHandlers[parsed.type];

        invariant(
          handlerOption !== undefined,
          `Server is not configured to handle this type of message: ${JSON.stringify(parsed)}`
        );

        const session = this.userSessionRegistry.getExpectedSession(userConnectionEndpoint.id);

        // TS asks: what argument would be valid for *any* possible handler?
        // Because this is a union of handlers, the parameter type becomes the
        // intersection of all payload types, which collapses to `never`.
        // Since we look up handler in a typed record and check it is not undefined
        // we can say the data is the correct type for the handler
        try {
          const outbox = await handlerOption(parsed.data as never, session);
          this.dispatchOutboxMessages(outbox);
        } catch (error) {
          if (error instanceof Error) {
            const errorOutbox = new MessageDispatchOutbox<GameStateUpdate>(
              this.updateDispatchFactory
            );
            errorOutbox.pushToConnection(session.connectionId, {
              type: GameStateUpdateType.ErrorMessage,
              data: { message: error.message },
            });
            this.dispatchOutboxMessages(errorOutbox);

            console.trace(error);
          } else {
            console.trace(error);
          }
        }
      });
    });

    userConnectionEndpoint.on("close", async (reason) => {
      try {
        await this.disconnectionHandler(session, reason);
      } catch (error) {
        console.info("error in disconnectionHandler", this.name);
        console.trace(error);
      }
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
