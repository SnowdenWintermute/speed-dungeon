import { GameServerName, GuestSingleUseReconnectionKey } from "../../../aliases.js";
import { GameStateUpdate, GameStateUpdateType } from "../../../packets/game-state-updates.js";
import {
  ConnectionContextType,
  PlayerReconnectionProtocol,
} from "../../reconnection-protocol/index.js";
import { UserIdType } from "../../sessions/user-ids.js";
import { UserSession } from "../../sessions/user-session.js";
import { MessageDispatchFactory } from "../../update-delivery/message-dispatch-factory.js";
import { MessageDispatchOutbox } from "../../update-delivery/outbox.js";
import { ReconnectionOpportunityManager } from "../reconnection-opportunity-manager.js";
import { randomBytes } from "crypto";
import { ReconnectionOpportunity } from "../reconnection-opportunity.js";
import { GameServerGameLifecycleController } from "../controllers/game-lifecycle/index.js";
import { SpeedDungeonGame } from "../../../game/index.js";
import { RECONNECTION_OPPORTUNITY_TIMEOUT_MS } from "../../../app-consts.js";
import { GameSessionConnectionStatus } from "../../sessions/global-auth-game-session.js";
import { UserGlobalGameSessionStore } from "../../services/global-auth-game-connection-session-store/index.js";
import { OpaqueEncryptionTokenCodec } from "../../lobby-server/game-handoff/session-claim-token.js";
import { GuestSessionReconnectionToken } from "./guest-session-reconnection-token.js";
import { UserSessionRegistry } from "../../sessions/user-session-registry.js";

interface GameServerReconnectionContext {
  type: ConnectionContextType.GameServerReconnection;
  attemptReconnectionClaim: () => Promise<void>;
}

interface GameServerInitialConnectionContext {
  type: ConnectionContextType.InitialConnection;
}

interface GameServerConnectionPreemptionContext {
  type: ConnectionContextType.GameServerSessionPreemption;
  oldSession: UserSession;
}

export type GameServerConnectionContext =
  | GameServerReconnectionContext
  | GameServerInitialConnectionContext
  | GameServerConnectionPreemptionContext;

export class GameServerReconnectionProtocol implements PlayerReconnectionProtocol {
  constructor(
    private readonly updateDispatchFactory: MessageDispatchFactory<GameStateUpdate>,
    private readonly reconnectionOpportunityManager: ReconnectionOpportunityManager,
    private readonly userSessionRegistry: UserSessionRegistry,
    private readonly gameLifecycleController: GameServerGameLifecycleController,
    private readonly globalGameSessionStore: UserGlobalGameSessionStore,
    private readonly guestSessionReconnectionTokenCodec: OpaqueEncryptionTokenCodec<GuestSessionReconnectionToken>,
    private readonly dispatchOutboxMessages: (
      outbox: MessageDispatchOutbox<GameStateUpdate>
    ) => void
  ) {}

  async evaluateConnectionContext(
    session: UserSession,
    gameIsInProgress: boolean
  ): Promise<GameServerConnectionContext> {
    const existingSessionOption = this.userSessionRegistry.getSessionByUserId(
      session.taggedUserId.id
    );
    if (existingSessionOption) {
      return {
        type: ConnectionContextType.GameServerSessionPreemption,
        oldSession: existingSessionOption,
      };
    }

    if (!gameIsInProgress) {
      return { type: ConnectionContextType.InitialConnection };
    } else {
      return {
        type: ConnectionContextType.GameServerReconnection,
        attemptReconnectionClaim: async () => await this.attemptReconnectionClaim(session),
      };
    }
  }

  async issueReconnectionCredential(
    session: UserSession
  ): Promise<MessageDispatchOutbox<GameStateUpdate>> {
    if (session.taggedUserId.type === UserIdType.Auth) {
      // auth users are reconnected via their auth ID so they don't need a token
      return new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
    }

    const newReconnectionKey = this.generateGuestSingleUseReconnectionKey();
    const newToken = new GuestSessionReconnectionToken(session.taggedUserId.id, newReconnectionKey);
    session.setGuestReconnectionToken(newToken);

    const encryptedToken = await this.guestSessionReconnectionTokenCodec.encode(newToken);
    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
    outbox.pushToConnection(session.connectionId, {
      type: GameStateUpdateType.CacheGuestSessionReconnectionToken,
      data: {
        token: encryptedToken,
      },
    });

    return outbox;
  }

  encodeBase64Url(buffer: Buffer): string {
    return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  private generateGuestSingleUseReconnectionKey(): GuestSingleUseReconnectionKey {
    return this.encodeBase64Url(randomBytes(32)) as GuestSingleUseReconnectionKey;
  }

  async onPlayerDisconnected(
    session: UserSession,
    gameServerName: GameServerName
  ): Promise<MessageDispatchOutbox<GameStateUpdate>> {
    const outbox = new MessageDispatchOutbox(this.updateDispatchFactory);
    const game = session.getCurrentGameOption();
    if (game === null) {
      return outbox;
    }

    // const leaveGameHandlerOutbox = await this.gameLifecycleController.leaveGameHandler(session);
    // outbox.pushFromOther(leaveGameHandlerOutbox);

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

      await this.globalGameSessionStore.updateSessionConnectionStatus(
        session.taggedUserId,
        GameSessionConnectionStatus.AwaitingReconnection
      );
    } catch (error) {
      console.error("error creating reconnection opportunity", error);
    }

    return outbox;
  }

  async cleanUpTimedOutClaim(session: UserSession, game: SpeedDungeonGame) {
    this.reconnectionOpportunityManager.remove(session.requireReconnectionKey());

    await this.globalGameSessionStore.clearSession(session.taggedUserId);

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
    await this.globalGameSessionStore.updateSessionConnectionStatus(
      session.taggedUserId,
      GameSessionConnectionStatus.ConnectedToGameServer
    );

    console.info(`user ${session.username} reconnecting to game ${session.currentGameId}`);

    // give them a username that matches their old one if they are a guest since guest would have
    // some randomly assigned name and we need to give them the name they had when they disconnected
    // so it will match their player in game
    session.username = reconnectionOpportunityOption.username;
  }
}
