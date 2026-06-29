import { ChannelName, ConnectionId } from "../aliases.js";
import { ClientIntent } from "../packets/client-intents.js";
import { GameStateUpdate, GameStateUpdateType } from "../packets/game-state-updates.js";
import { ConnectionEndpoint } from "../transport/connection-endpoint.js";
import { TransportDisconnectReason } from "../transport/disconnect-reasons.js";
import { RandomNumberGenerationPolicy } from "../utility-classes/random-number-generation-policy.js";
import { invariant } from "../utils/index.js";
import { GameServerClientIntentHandlers } from "./game-server/create-game-server-client-intent-handlers.js";
import { IncomingConnectionGateway } from "./incoming-connection-gateway.js";
import { LobbyClientIntentHandlers } from "./lobby-server/create-lobby-client-intent-handlers.js";
import {
  CrossServerBroadcastType,
  CrossServerBroadcasterService,
} from "./services/cross-server-broadcaster/index.js";
import { ServerCommand } from "./services/server-command/index.js";
import { ConnectionIdentityResolutionContext } from "./services/identity-provider.js";
import { UserSessionRegistry } from "./sessions/user-session-registry.js";
import { UserSession } from "./sessions/user-session.js";
import {
  MessageDispatchFactory,
  MessageDispatchType,
} from "./update-delivery/message-dispatch-factory.js";
import { OutgoingMessageGateway } from "./update-delivery/message-gateway.js";
import { MessageDispatchOutbox } from "./update-delivery/outbox.js";
import { ERROR_MESSAGES } from "../errors/index.js";

/** Ensures sequential execution of all state-mutating work: connection setup, intent handling,
 * and disconnection cleanup.
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

  protected readonly executor = new GlobalIntentExecutor();

  constructor(
    readonly name: string,
    protected readonly incomingConnectionGateway: IncomingConnectionGateway,
    protected readonly rngPolicy: RandomNumberGenerationPolicy,
    protected readonly crossServerBroadcaster: CrossServerBroadcasterService<
      GameStateUpdate,
      ServerCommand
    >
  ) {
    this.crossServerBroadcaster.subscribe((broadcast) => {
      switch (broadcast.type) {
        case CrossServerBroadcastType.ChannelFanOut: {
          const { channelName, payload, excludedConnectionIds } = broadcast;
          const excluded = new Set(excludedConnectionIds);
          const recipientIds = this.userSessionRegistry
            .in(channelName)
            .filter((id) => !excluded.has(id));
          this.outgoingMessagesGateway.submitToConnections(recipientIds, payload);
          break;
        }
        case CrossServerBroadcastType.ServerCommand:
          this.handleServerCommand(broadcast.command);
          break;
      }
    });
  }

  async crossServerBroadcast(
    channelName: ChannelName,
    payload: GameStateUpdate,
    excludedConnectionIds: ConnectionId[] = []
  ): Promise<void> {
    await this.crossServerBroadcaster.publish({
      type: CrossServerBroadcastType.ChannelFanOut,
      channelName,
      payload,
      excludedConnectionIds,
    });
  }

  async crossServerCommand(command: ServerCommand): Promise<void> {
    await this.crossServerBroadcaster.publish({
      type: CrossServerBroadcastType.ServerCommand,
      command,
    });
  }

  protected handleServerCommand(_command: ServerCommand): void {}

  closeTransportServer() {
    return this.incomingConnectionGateway.close();
  }

  protected logUserConnected(session: UserSession) {
    const { username, taggedUserId, connectionId } = session;
    console.info(
      `-- ${username} (user id: ${taggedUserId.id}, connection id: ${connectionId}) joined the [${this.name}] server`
    );
  }

  protected logUserDisconnected(session: UserSession, reason: TransportDisconnectReason) {
    console.info(
      `-- ${session.username} (${session.connectionId}) disconnected from [${this.name}] server. ${reason}`
    );
  }

  private parseMessage(rawData: string | ArrayBuffer | Buffer) {
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

        const session = this.userSessionRegistry.requireSession(userConnectionEndpoint.id);

        const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
        session.incrementLastIntentHandledId();
        const intentId = session.lastIntentHandledId;

        // why cast as never: see README.md -> Typed Event Handler Records
        try {
          if (handlerOption === undefined) {
            console.error(
              `Server is not configured to handle this type of message: ${JSON.stringify(parsed)}`
            );
            throw new Error(ERROR_MESSAGES.SERVER_GENERIC);
          }

          const handlerOutbox = await handlerOption(parsed.data as never, session);
          outbox.pushFromOther(handlerOutbox);
        } catch (error) {
          if (error instanceof Error) {
            outbox.pushToConnection(session.connectionId, {
              type: GameStateUpdateType.ErrorMessage,
              data: { message: error.message, clientIntentSequenceId: intentId },
            });
            console.trace(error);
          } else {
            console.trace(error);
          }
        } finally {
          outbox.pushToConnection(session.connectionId, {
            type: GameStateUpdateType.EndOfUpdateStream,
            data: {
              clientIntentSequenceId: intentId,
            },
          });
          this.dispatchOutboxMessages(outbox);
        }
      });
    });

    userConnectionEndpoint.on("close", (reason) => {
      this.executor.enqueue(async () => {
        try {
          await this.disconnectionHandler(session, reason);
        } catch (error) {
          console.info("error in disconnectionHandler", this.name);
          console.trace(error);
        }
      });
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

  protected abstract connectionHandler(
    connectionEndpoint: ConnectionEndpoint,
    identityResolutionContext: ConnectionIdentityResolutionContext
  ): Promise<void>;

  protected abstract disconnectionHandler(
    session: UserSession,
    reason: TransportDisconnectReason | number
  ): Promise<void>;
}
