import { ConnectionId, GameName } from "../../../aliases.js";
import { SpeedDungeonGame } from "../../../game/index.js";
import { GameStateUpdate, GameStateUpdateType } from "../../../packets/game-state-updates.js";
import { IdGenerator } from "../../../utility-classes/index.js";
import { GameSessionStoreService } from "../../services/game-session-store/index.js";
import { PendingGameSetup } from "../../services/game-session-store/pending-game-setup.js";
import { UserSessionRegistry } from "../../sessions/user-session-registry.js";
import { UserSession } from "../../sessions/user-session.js";
import { MessageDispatchFactory } from "../../update-delivery/message-dispatch-factory.js";
import { MessageDispatchOutbox } from "../../update-delivery/outbox.js";
import { GameServerConnectionType } from "./connection-instructions.js";
import { GameServerSessionClaimToken } from "./session-claim-token.js";

export class GameHandoffManager {
  constructor(
    private readonly userSessionRegistry: UserSessionRegistry,
    private readonly updateFactory: MessageDispatchFactory<GameStateUpdate>,
    private readonly gameSessionStoreService: GameSessionStoreService,
    private readonly idGenerator: IdGenerator
  ) {}

  private getPlayerSessionsInGame(game: SpeedDungeonGame) {
    const result: UserSession[] = [];

    for (const [username, player] of game.getPlayers()) {
      const session = this.userSessionRegistry.getExpectedSessionInGame(username, game.name);

      result.push(session);
    }

    return result;
  }

  private prepareClaimTokens(sessions: UserSession[], gameId: string) {
    const claimTokensByConnectionId = new Map<ConnectionId, GameServerSessionClaimToken>();

    for (const session of sessions) {
      const claimToken = new GameServerSessionClaimToken(gameId, session.username);
      claimTokensByConnectionId.set(session.connectionId, claimToken);
    }

    return claimTokensByConnectionId;
  }

  // on all players in lobby game ready to start game
  // handle a handoff from Lobby to GameServer
  async initiateGameHandoff(game: SpeedDungeonGame) {
    // - getLeastBusyGameServerOrProvisionOne()
    const leastBusyServerUrl = "";

    await this.gameSessionStoreService.writePendingGameSetup(game.id, new PendingGameSetup(game));

    const sessionsInGame = this.getPlayerSessionsInGame(game);
    const claimTokens = this.prepareClaimTokens(sessionsInGame, game.id);

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateFactory);
    for (const [connectionId, token] of claimTokens) {
      // @TODO - encrypt the token
      // const encryptedToken =
      outbox.pushToConnection(connectionId, {
        type: GameStateUpdateType.GameServerConnectionInstructions,
        data: {
          connectionInstructions: {
            type: GameServerConnectionType.Remote,
            url: leastBusyServerUrl, // game server url
            sessionClaimToken: token,
          },
        },
      });
    }
  }
}
