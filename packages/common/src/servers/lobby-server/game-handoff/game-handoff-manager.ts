import { ConnectionId, GameName, SessionClaimId, Username } from "../../../aliases.js";
import { SpeedDungeonGame } from "../../../game/index.js";
import { SpeedDungeonPlayer } from "../../../game/player.js";
import { GameStateUpdate } from "../../../packets/game-state-updates.js";
import { IdGenerator } from "../../../utility-classes/index.js";
import { GameSessionStoreService } from "../../services/game-session-store/index.js";
import { PendingGameSetup } from "../../services/game-session-store/pending-game-setup.js";
import { UserId } from "../../sessions/user-ids.js";
import { UserSessionRegistry } from "../../sessions/user-session-registry.js";
import { UserSession } from "../../sessions/user-session.js";
import { MessageDispatchFactory } from "../../update-delivery/message-dispatch-factory.js";
import { MessageDispatchOutbox } from "../../update-delivery/outbox.js";
import { PendingGameServerUserSession } from "./pending-user-session.js";
import { GameServerSessionClaimToken } from "./session-claim-token.js";

export class GameHandoffManager {
  private connectionInstructionsAwaitingGameSetupConfirmation = new Map<
    GameName,
    MessageDispatchOutbox<GameStateUpdate>
  >();

  constructor(
    private readonly userSessionRegistry: UserSessionRegistry,
    private readonly updateFactory: MessageDispatchFactory<GameStateUpdate>,
    private readonly gameSessionStoreService: GameSessionStoreService,
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
        pendingSession.playerUsername,
        pendingSession.expirationTimestamp
      );

      pendingSessionsByClaimId.set(claimId, pendingSession);
      claimTokensByConnectionId.set(lobbySession.connectionId, claimToken);
    }

    return { pendingSessionsByClaimId, claimTokensByConnectionId };
  }

  // handle a handoff from Lobby to GameServer
  async initiateGameHandoff(game: SpeedDungeonGame) {
    // on all players in lobby game ready to start game
    // - getLeastBusyGameServerOrProvisionOne()
    const sessionsInGame = this.getPlayerSessionsInGame(game);

    const userIdsByUsername = new Map<Username, UserId>();
    for (const [username, data] of sessionsInGame) {
      userIdsByUsername.set(username, data.session.userId);
    }

    // - await write PendingGameSetup to a central store in a Record<GameId, PendingGameSetup> (valkey or in-memory)
    //   - PendingGameSetup has a TTL that will somehow get it cleaned up if no game server tries to claim it
    //   - PendingGameSetup includes SpeedDungeonGame and a Map<Username, UserId> so when users present their
    //     tokens GameServer can create a session for them by UserId without exposing UserId to the client in the token
    await this.gameSessionStoreService.writePendingGameSetup(
      game.id,
      new PendingGameSetup(game, userIdsByUsername)
    );

    // - lobby issues signed GameServerSessionClaimToken to users which include
    //    - URL of game server
    //    - PendingGameSetup game ID
    //    - Username to attach to the corresponding Player in the PendingGameSetup
    //    - Expiry
    //    - Nonce
    // - clients use the URL in the token to open connections to the GameServer and present their tokens in the handshake
    //
    //
    // const targetServer = this.gameServerSessionRegistry.getLeastBusyGameServer();
    // const pendingSessions = this.createPendingPlayerSessions(game);
    // const { pendingSessionsByClaimId, claimTokensByConnectionId } = this.prepareClaimTokens(
    //   pendingSessions,
    //   game.name
    // );
    // // create an outbox with message for the game server that a new game with these pendingSessionsByClaimId
    // // should be created
    // // const status = await targetServer.handleNewActiveGame(game, pendingSessionsByClaimId);
    // // if (status.success !== true) {
    // //   throw new Error("unhandled failure of handoff to game server");
    // // }
    // // stage outbox and wait for confirmation from game server that game is ready
    // // before sending claims to players
    // const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateFactory);
    // for (const [connectionId, sessionClaimToken] of claimTokensByConnectionId) {
    //   outbox.pushToConnection(connectionId, {
    //     type: GameStateUpdateType.GameServerConnectionInstructions,
    //     data: {
    //       connectionInstructions: {
    //         type: GameServerConnectionType.Remote,
    //         url: "",
    //         sessionClaimToken,
    //       },
    //     },
    //   });
    // }
    // this.connectionInstructionsAwaitingGameSetupConfirmation.set(game.name, outbox);
  }

  onGameReadyHandler(gameName: GameName) {
    // find a staged outbox for this game name
    // - sends GameServerAddress to Players
    // - sends GameServerSessionClaimToken to Players
    // @TODO - use strategy to determine connectionInstructions from claimtokens
  }
}
