import { ConnectionId, GameName, SessionClaimId, Username } from "../../../aliases.js";
import { SpeedDungeonGame } from "../../../game/index.js";
import { SpeedDungeonPlayer } from "../../../game/player.js";
import { GameStateUpdate, GameStateUpdateType } from "../../../packets/game-state-updates.js";
import { IdGenerator } from "../../../utility-classes/index.js";
import { GameServerSessionRegistry } from "../../sessions/game-server-session-registry.js";
import { UserSessionRegistry } from "../../sessions/user-session-registry.js";
import { UserSession } from "../../sessions/user-session.js";
import { MessageDispatchFactory } from "../../update-delivery/message-dispatch-factory.js";
import { MessageDispatchOutbox } from "../../update-delivery/outbox.js";
import { GameServerConnectionType } from "./connection-instructions.js";
import { PendingGameServerUserSession } from "./pending-user-session.js";
import { GameServerSessionClaimToken } from "./session-claim-token.js";

export class GameHandoffManager {
  private connectionInstructionsAwaitingGameSetupConfirmation = new Map<
    GameName,
    MessageDispatchOutbox<GameStateUpdate>
  >();

  constructor(
    private readonly gameServerSessionRegistry: GameServerSessionRegistry,
    private readonly userSessionRegistry: UserSessionRegistry,
    private readonly updateFactory: MessageDispatchFactory<GameStateUpdate>,
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
    const targetServer = this.gameServerSessionRegistry.getLeastBusyGameServer();
    const pendingSessions = this.createPendingPlayerSessions(game);
    const { pendingSessionsByClaimId, claimTokensByConnectionId } = this.prepareClaimTokens(
      pendingSessions,
      game.name
    );

    // create an outbox with message for the game server that a new game with these pendingSessionsByClaimId
    // should be created
    // const status = await targetServer.handleNewActiveGame(game, pendingSessionsByClaimId);

    // if (status.success !== true) {
    //   throw new Error("unhandled failure of handoff to game server");
    // }

    // stage outbox and wait for confirmation from game server that game is ready
    // before sending claims to players
    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateFactory);
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

    this.connectionInstructionsAwaitingGameSetupConfirmation.set(game.name, outbox);
  }

  onGameReadyHandler(gameName: GameName) {
    // find a staged outbox for this game name
    // - sends GameServerAddress to Players
    // - sends GameServerSessionClaimToken to Players
    // @TODO - use strategy to determine connectionInstructions from claimtokens
  }
}
