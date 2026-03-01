import { GameStateUpdate, GameStateUpdateType } from "../../../packets/game-state-updates.js";
import { UserSessionRegistry } from "../../sessions/user-session-registry.js";
import { UserSession } from "../../sessions/user-session.js";
import { ConnectionIdentityResolutionContext } from "../../services/identity-provider.js";
import { ConnectionId, Milliseconds } from "../../../aliases.js";
import { MessageDispatchFactory } from "../../update-delivery/message-dispatch-factory.js";
import { SessionLifecycleController } from "../../controllers/session-lifecycle.js";
import { GameRegistry } from "../../game-registry.js";
import { MessageDispatchOutbox } from "../../update-delivery/outbox.js";
import { GameServerSessionClaimTokenCodec } from "../../lobby-server/game-handoff/session-claim-token.js";

export class GameServerSessionLifecycleController
  implements SessionLifecycleController<GameStateUpdate>
{
  /** nonce / expiration timestamp */
  private recentlyUsedNonces = new Map<string, Milliseconds>();

  constructor(
    private readonly userSessionRegistry: UserSessionRegistry,
    private readonly gameRegistry: GameRegistry,
    private readonly updateDispatchFactory: MessageDispatchFactory<GameStateUpdate>,
    private readonly gameServerSessionClaimTokenCodec: GameServerSessionClaimTokenCodec
  ) {}

  async createSession(
    connectionId: ConnectionId,
    context: ConnectionIdentityResolutionContext
  ): Promise<UserSession> {
    const sessionClaimTokenOption = context.encodedGameServerSessionClaimToken;
    if (sessionClaimTokenOption === undefined) {
      throw new Error("No token was provided when attempting to join the game server");
    }

    const decryptedToken =
      await this.gameServerSessionClaimTokenCodec.decode(sessionClaimTokenOption);

    const tokenIsExpired = Date.now() > decryptedToken.expirationTimestamp;
    if (tokenIsExpired) {
      throw new Error("User presented an expired token when attempting to join the game server");
    }

    const now = Date.now();
    for (const [nonce, expirationTimestamp] of this.recentlyUsedNonces) {
      const nonceUseRecordIsExpired = expirationTimestamp < now;
      if (nonceUseRecordIsExpired) {
        this.recentlyUsedNonces.delete(nonce);
      }
    }

    const { nonce } = decryptedToken;
    if (this.recentlyUsedNonces.has(nonce)) {
      throw new Error("Token replay attack suspected");
    }
    this.recentlyUsedNonces.set(nonce, decryptedToken.expirationTimestamp);

    // it is possible to be given a reconnection token in two separate browser tabs
    // while the disconnection record is live in the central store, and there would be
    // undefined behavior if a user tried to claim a session while already in a game
    if (this.userSessionRegistry.userIsAlreadyConnected(decryptedToken.taggedUserId.id)) {
      throw new Error("Only one connection per user is permitted on a single game server");
    }

    const newSession = new UserSession(
      decryptedToken.username,
      connectionId,
      decryptedToken.taggedUserId,
      this.gameRegistry
    );

    if (decryptedToken.reconnectionTokenOption) {
      newSession.setGuestReconnectionToken(decryptedToken.reconnectionTokenOption);
    }

    newSession.currentGameName = decryptedToken.gameName;
    newSession.currentPartyName = decryptedToken.partyName;

    return newSession;
  }

  async activateSession(session: UserSession): Promise<MessageDispatchOutbox<GameStateUpdate>> {
    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
    this.userSessionRegistry.register(session);

    // tell the client their username since if they are a reconnecting guest they will have some random
    // username from the lobby and we want to give them the username they disconnected with
    outbox.pushToConnection(session.connectionId, {
      type: GameStateUpdateType.OnConnection,
      data: { username: session.username },
    });
    return outbox;
  }

  async cleanupSession(session: UserSession) {
    const outbox = new MessageDispatchOutbox(this.updateDispatchFactory);
    this.userSessionRegistry.unregister(session.connectionId);
    return outbox;
  }
}
