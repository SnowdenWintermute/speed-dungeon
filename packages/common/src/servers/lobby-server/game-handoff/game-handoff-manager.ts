import { ConnectionId, GameName } from "../../../aliases.js";
import { SpeedDungeonGame } from "../../../game/index.js";
import { GameStateUpdate, GameStateUpdateType } from "../../../packets/game-state-updates.js";
import { invariant } from "../../../utils/index.js";
import { GameSessionStoreService } from "../../services/game-session-store/index.js";
import { PendingGameSetup } from "../../services/game-session-store/pending-game-setup.js";
import { UserSessionRegistry } from "../../sessions/user-session-registry.js";
import { UserSession } from "../../sessions/user-session.js";
import { MessageDispatchFactory } from "../../update-delivery/message-dispatch-factory.js";
import { MessageDispatchOutbox } from "../../update-delivery/outbox.js";
import { LobbyState } from "../lobby-state.js";
import {
  GameServerSessionClaimToken,
  GameServerSessionClaimTokenCodec,
} from "./session-claim-token.js";

export class GameHandoffManager {
  constructor(
    private readonly userSessionRegistry: UserSessionRegistry,
    private readonly updateFactory: MessageDispatchFactory<GameStateUpdate>,
    private readonly gameSessionStoreService: GameSessionStoreService,
    private readonly lobbyState: LobbyState,
    private readonly gameServerSessionClaimTokenCodec: GameServerSessionClaimTokenCodec,
    private readonly getLeastBusyServerUrl: () => Promise<string>
  ) {}

  private getPlayerSessionsInGame(game: SpeedDungeonGame) {
    const result: UserSession[] = [];

    for (const [username, player] of game.getPlayers()) {
      const session = this.userSessionRegistry.getExpectedSessionInGameByUsername(
        username,
        game.name
      );

      result.push(session);
    }

    return result;
  }

  private prepareClaimTokens(sessions: UserSession[], gameName: GameName) {
    const claimTokensByConnectionId = new Map<ConnectionId, GameServerSessionClaimToken>();

    for (const session of sessions) {
      invariant(session.currentPartyName !== null);
      const claimToken = new GameServerSessionClaimToken(
        gameName,
        session.currentPartyName,
        session.username,
        session.taggedUserId,
        session.getGuestReconnectionTokenOption() || undefined
      );
      claimTokensByConnectionId.set(session.connectionId, claimToken);
    }

    return claimTokensByConnectionId;
  }

  // on all players in lobby game ready to start game
  // handle a handoff from Lobby to GameServer
  async initiateGameHandoff(game: SpeedDungeonGame) {
    // @TODO - resolve to a placeholder url for a single static test server
    // - getLeastBusyGameServerOrProvisionOne()
    const leastBusyServerUrl = await this.getLeastBusyServerUrl();

    const sessionsInGame = this.getPlayerSessionsInGame(game);

    await this.gameSessionStoreService.writePendingGameSetup(
      game.name,
      new PendingGameSetup(game.toSerialized(), sessionsInGame)
    );

    const claimTokens = this.prepareClaimTokens(sessionsInGame, game.name);

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateFactory);

    for (const [connectionId, token] of claimTokens) {
      const encryptedToken = await this.gameServerSessionClaimTokenCodec.encode(token);
      outbox.pushToConnection(connectionId, {
        type: GameStateUpdateType.GameServerConnectionInstructions,
        data: {
          connectionInstructions: {
            url: leastBusyServerUrl, // game server url
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
