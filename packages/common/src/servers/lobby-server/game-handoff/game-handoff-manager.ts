import { ConnectionId, GameId, GameName, GameServerName } from "../../../aliases.js";
import { SpeedDungeonGame } from "../../../game/index.js";
import { GameStateUpdate, GameStateUpdateType } from "../../../packets/game-state-updates.js";
import { invariant } from "../../../utils/index.js";
import { GameSessionStoreService } from "../../services/game-session-store/index.js";
import { PendingGameSetup } from "../../services/game-session-store/pending-game-setup.js";
import { UserGlobalGameSessionStore } from "../../services/global-auth-game-connection-session-store/index.js";
import { GameSessionConnectionStatus } from "../../sessions/global-auth-game-session.js";
import { UserSessionRegistry } from "../../sessions/user-session-registry.js";
import { UserSession } from "../../sessions/user-session.js";
import { MessageDispatchFactory } from "../../update-delivery/message-dispatch-factory.js";
import { MessageDispatchOutbox } from "../../update-delivery/outbox.js";
import { GameServerSessionClaimToken, OpaqueEncryptionTokenCodec } from "./session-claim-token.js";

export class GameHandoffManager {
  constructor(
    private readonly userSessionRegistry: UserSessionRegistry,
    private readonly updateFactory: MessageDispatchFactory<GameStateUpdate>,
    private readonly gameSessionStoreService: GameSessionStoreService,
    private readonly globalGameSessionStore: UserGlobalGameSessionStore,
    private readonly gameServerSessionClaimTokenCodec: OpaqueEncryptionTokenCodec<GameServerSessionClaimToken>,
    private readonly getLeastBusyGameServer: () => Promise<{ name: GameServerName; url: string }>
  ) {}

  private async prepareClaimTokens(sessions: UserSession[], gameId: GameId, gameServerUrl: string) {
    const claimTokensByConnectionId = new Map<ConnectionId, GameServerSessionClaimToken>();

    for (const session of sessions) {
      invariant(session.currentPartyName !== null, "expected session to have a party");
      const tokenOption = session.getGuestReconnectionTokenOption();
      const claimToken = new GameServerSessionClaimToken(
        gameId,
        session.currentPartyName,
        session.username,
        session.taggedUserId,
        gameServerUrl,
        tokenOption || undefined
      );
      claimTokensByConnectionId.set(session.connectionId, claimToken);
    }

    return claimTokensByConnectionId;
  }

  async initiateGameHandoff(game: SpeedDungeonGame) {
    const leastBusyServer = await this.getLeastBusyGameServer();

    await this.gameSessionStoreService.writePendingGameSetup(
      game.id,
      new PendingGameSetup(game.toSerialized(), leastBusyServer.name)
    );

    const sessionsInGame = this.userSessionRegistry.getAllSessionsInGame(game);
    const claimTokens = await this.prepareClaimTokens(sessionsInGame, game.id, leastBusyServer.url);

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateFactory);

    for (const session of sessionsInGame) {
      const token = claimTokens.get(session.connectionId);
      invariant(
        token !== undefined,
        "should have created a game server session claim token for this connection id"
      );
      await this.globalGameSessionStore.registerSession(
        session,
        leastBusyServer.name,
        GameSessionConnectionStatus.InitialConnectionPending
      );

      const encryptedToken = await this.gameServerSessionClaimTokenCodec.encode(token);
      outbox.pushToConnection(session.connectionId, {
        type: GameStateUpdateType.GameServerConnectionInstructions,
        data: {
          connectionInstructions: {
            url: leastBusyServer.url, // game server url
            encryptedSessionClaimToken: encryptedToken,
          },
        },
      });
    }

    // currently we assume the game will be removed from the lobby's registry
    // once the last player client disconnects to go join it

    return outbox;
  }
}
