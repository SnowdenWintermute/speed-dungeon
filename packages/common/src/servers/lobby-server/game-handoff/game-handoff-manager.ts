import { ConnectionId, GameName, SessionClaimId, Username } from "../../../aliases.js";
import { SpeedDungeonGame } from "../../../game/index.js";
import { SpeedDungeonPlayer } from "../../../game/player.js";
import { GameStateUpdateType } from "../../../packets/game-state-updates.js";
import { IdGenerator } from "../../../utility-classes/index.js";
import { UserSessionRegistry } from "../../sessions/user-session-registry.js";
import { UserSession } from "../../sessions/user-session.js";
import { GameStateUpdateDispatchFactory } from "../../update-delivery/game-state-update-dispatch-factory.js";
import { GameStateUpdateDispatchOutbox } from "../../update-delivery/outbox.js";
import { GameServerNodeDirectory } from "../game-server-node-directory.js";
import { GameServerConnectionType } from "./connection-instructions.js";
import { PendingGameServerUserSession } from "./pending-user-session.js";
import { GameServerSessionClaimToken } from "./session-claim-token.js";

export class GameHandoffManager {
  private connectionInstructionsAwaitingGameSetupConfirmation = new Map<
    GameName,
    GameStateUpdateDispatchOutbox
  >();

  constructor(
    private readonly gameServerNodeDirectory: GameServerNodeDirectory,
    private readonly userSessionRegistry: UserSessionRegistry,
    private readonly updateFactory: GameStateUpdateDispatchFactory,
    private readonly idGenerator: IdGenerator
  ) {}

  private getPlayerSessionsInGame(game: SpeedDungeonGame) {
    const result = new Map<Username, { session: UserSession; player: SpeedDungeonPlayer }>();

    for (const [username, player] of game.getPlayers()) {
      const session = this.userSessionRegistry.getExpectedSessionInGame(username, game.name);

      result.set(username, { session, player });
    }

    return result;
  }

  private createPendingPlayerSessions(game: SpeedDungeonGame): PendingGameServerUserSession[] {
    const sessionsInGameByUsername = this.getPlayerSessionsInGame(game);
    const result = Array.from(sessionsInGameByUsername).map(([username, { session, player }]) => {
      const partyName = player.getExpectedPartyName();
      return new PendingGameServerUserSession(session.userId, username, game.name, partyName);
    });

    return result;
  }

  private prepareClaimTokens(pendingSessions: PendingGameServerUserSession[], gameName: GameName) {
    const pendingSessionsByClaimId = new Map<SessionClaimId, PendingGameServerUserSession>();
    const claimTokensByConnectionId = new Map<ConnectionId, GameServerSessionClaimToken>();

    for (const pendingSession of pendingSessions) {
      const lobbySession = this.userSessionRegistry.getExpectedSessionInGame(
        pendingSession.playerUsername,
        pendingSession.currentGameName
      );
      const claimId = this.idGenerator.generate() as SessionClaimId;
      // @TODO - sign the token signature with lobby private key
      const claimToken = new GameServerSessionClaimToken(
        claimId,
        gameName,
        pendingSession.expirationTimestamp
      );

      pendingSessionsByClaimId.set(claimId, pendingSession);
      claimTokensByConnectionId.set(lobbySession.connectionId, claimToken);
    }

    return { pendingSessionsByClaimId, claimTokensByConnectionId };
  }

  // handle a handoff from Lobby to GameServer
  async initiateGameHandoff(game: SpeedDungeonGame) {
    const targetServerNode = this.gameServerNodeDirectory.getLeastBusyGameServerNode();
    const pendingSessions = this.createPendingPlayerSessions(game);
    const { pendingSessionsByClaimId, claimTokensByConnectionId } = this.prepareClaimTokens(
      pendingSessions,
      game.name
    );

    const status = await targetServerNode.handleNewActiveGame(game, pendingSessionsByClaimId);

    if (status.success !== true) {
      throw new Error("unhandled failure of handoff to game server");
    }

    const outbox = new GameStateUpdateDispatchOutbox(this.updateFactory);
    for (const [connectionId, sessionClaimToken] of claimTokensByConnectionId) {
      outbox.pushToConnection(connectionId, {
        type: GameStateUpdateType.GameServerConnectionInstructions,
        data: {
          connectionInstructions: {
            type: GameServerConnectionType.Remote,
            url: "",
            sessionClaimToken,
          },
        },
      });
    }

    // stage outbox and wait for confirmation from game server that game is ready
    // before sending claims to players
    this.connectionInstructionsAwaitingGameSetupConfirmation.set(game.name, outbox);
  }

  onGameReadyHandler(gameName: GameName) {
    // find a staged outbox for this game name
    // - sends GameServerAddress to Players
    // - sends GameServerSessionClaimToken to Players
    // @TODO - use strategy to determine connectionInstructions from claimtokens
  }
}
