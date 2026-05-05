import { GameServerName, GuestSessionReconnectionToken } from "../../../aliases.js";
import { GameStateUpdate, GameStateUpdateType } from "../../../packets/game-state-updates.js";
import {
  ConnectionContextType,
  PlayerReconnectionProtocol,
} from "../../reconnection-protocol/index.js";
import { ReconnectionForwardingStoreService } from "../../services/reconnection-forwarding-store/index.js";
import { UserIdType } from "../../sessions/user-ids.js";
import { UserSession } from "../../sessions/user-session.js";
import { MessageDispatchFactory } from "../../update-delivery/message-dispatch-factory.js";
import { MessageDispatchOutbox } from "../../update-delivery/outbox.js";
import { ReconnectionOpportunityManager } from "../reconnection-opportunity-manager.js";
import { randomBytes } from "crypto";
import { ReconnectionOpportunity } from "../reconnection-opportunity.js";
import { GameServerGameLifecycleController } from "../controllers/game-lifecycle/index.js";
import { GameServerReconnectionForwardingRecord } from "../../services/reconnection-forwarding-store/game-server-reconnection-forwarding-record.js";
import { SpeedDungeonGame } from "../../../game/index.js";
import { RECONNECTION_OPPORTUNITY_TIMEOUT_MS } from "../../../app-consts.js";
import { GameSessionStoreService } from "../../services/game-session-store/index.js";

interface GameServerReconnectionContext {
  type: ConnectionContextType.Reconnection;
  attemptReconnectionClaim: () => Promise<void>;
}

interface GameServerInitialConnectionContext {
  type: ConnectionContextType.InitialConnection;
}

export type GameServerConnectionContext =
  | GameServerReconnectionContext
  | GameServerInitialConnectionContext;

export class GameServerReconnectionProtocol implements PlayerReconnectionProtocol {
  constructor(
    private readonly updateDispatchFactory: MessageDispatchFactory<GameStateUpdate>,
    private readonly reconnectionForwardingStoreService: ReconnectionForwardingStoreService,
    private readonly reconnectionOpportunityManager: ReconnectionOpportunityManager,
    private readonly gameLifecycleController: GameServerGameLifecycleController,
    private readonly gameSessionStoreService: GameSessionStoreService,
    private readonly dispatchOutboxMessages: (
      outbox: MessageDispatchOutbox<GameStateUpdate>
    ) => void
  ) {}

  async evaluateConnectionContext(
    session: UserSession,
    gameIsInProgress: boolean
  ): Promise<GameServerConnectionContext> {
    if (!gameIsInProgress) {
      return { type: ConnectionContextType.InitialConnection };
    } else {
      return {
        type: ConnectionContextType.Reconnection,
        attemptReconnectionClaim: async () => await this.attemptReconnectionClaim(session),
      };
    }
  }

  /** After successful connection guest users will be provided a random bytes token to store on their client. 
      When they reconnect we will use it to find their reconnection opportunity */
  async issueReconnectionCredential(
    session: UserSession
  ): Promise<MessageDispatchOutbox<GameStateUpdate>> {
    if (session.taggedUserId.type === UserIdType.Auth) {
      // auth users are reconnected via their auth ID so they don't need a token
      return new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
    }

    const newReconnectionToken = this.generateGuestReconnectionToken();
    session.setGuestReconnectionToken(newReconnectionToken);

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
    outbox.pushToConnection(session.connectionId, {
      type: GameStateUpdateType.CacheGuestSessionReconnectionToken,
      data: {
        token: newReconnectionToken,
      },
    });

    return outbox;
  }

  encodeBase64Url(buffer: Buffer): string {
    return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  private generateGuestReconnectionToken(): GuestSessionReconnectionToken {
    return this.encodeBase64Url(randomBytes(32)) as GuestSessionReconnectionToken;
  }

  async onPlayerDisconnected(
    session: UserSession,
    gameServerName: GameServerName
  ): Promise<MessageDispatchOutbox<GameStateUpdate>> {
    const outbox = new MessageDispatchOutbox(this.updateDispatchFactory);
    const game = session.getCurrentGameOption();
    if (game === null) {
      const leaveGameHandlerOutbox = await this.gameLifecycleController.leaveGameHandler(session);
      outbox.pushFromOther(leaveGameHandlerOutbox);
      return outbox;
    }

    game.inputLock.add(session.taggedUserId.id);

    outbox.pushToChannel(game.getChannelName(), {
      type: GameStateUpdateType.PlayerDisconnectedWithReconnectionOpportunity,
      data: { username: session.username },
    });

    const onReconnectionTimeout = async () => {
      this.cleanUpTimedOutClaim(session, game);
    };

    try {
      this.reconnectionOpportunityManager.add(
        session.requireReconnectionKey(),
        new ReconnectionOpportunity(
          RECONNECTION_OPPORTUNITY_TIMEOUT_MS,
          session.username,
          onReconnectionTimeout
        )
      );

      const reconnectionForwardingRecord = GameServerReconnectionForwardingRecord.fromUserSession(
        session,
        gameServerName
      );

      await this.reconnectionForwardingStoreService.writeGameServerReconnectionForwardingRecord(
        session.requireReconnectionKey(),
        reconnectionForwardingRecord
      );
    } catch (error) {
      console.error("error creating reconnection opportunity", error);
    }

    return outbox;
  }

  async cleanUpTimedOutClaim(session: UserSession, game: SpeedDungeonGame) {
    this.reconnectionOpportunityManager.remove(session.requireReconnectionKey());
    try {
      await this.reconnectionForwardingStoreService.deleteGameServerReconnectionForwardingRecord(
        session.requireReconnectionKey()
      );
    } catch (error) {
      console.error("failed to delete reconnectionForwardingRecord:", error);
    }

    const reconnectionTimeoutOutbox = new MessageDispatchOutbox(this.updateDispatchFactory);

    reconnectionTimeoutOutbox.pushToChannel(game.getChannelName(), {
      type: GameStateUpdateType.PlayerReconnectionTimedOut,
      data: { username: session.username },
    });

    game.inputLock.remove(session.taggedUserId.id);

    const leaveGameHandlerOutbox = await this.gameLifecycleController.leaveGameHandler(session);
    reconnectionTimeoutOutbox.pushFromOther(leaveGameHandlerOutbox);

    this.dispatchOutboxMessages(reconnectionTimeoutOutbox);
  }

  async attemptReconnectionClaim(session: UserSession): Promise<void> {
    const reconnectionOpportunityOption = this.reconnectionOpportunityManager.get(
      session.requireReconnectionKey()
    );

    const claimExists = reconnectionOpportunityOption !== undefined;
    const isValidReconnection = claimExists && reconnectionOpportunityOption.claim();

    if (!isValidReconnection) {
      throw new Error("Invalid reconnection");
    }

    this.reconnectionOpportunityManager.remove(session.requireReconnectionKey());
    await this.reconnectionForwardingStoreService.deleteGameServerReconnectionForwardingRecord(
      session.requireReconnectionKey()
    );

    console.info(`user ${session.username} reconnecting to game ${session.currentGameName}`);

    // give them a username that matches their old one if they are a guest since guest would have
    // some randomly assigned name and we need to give them the name they had when they disconnected
    // so it will match their player in game
    session.username = reconnectionOpportunityOption.username;
  }
}
