import { ChannelName, ConnectionId, GameName, PartyName, Username } from "../../aliases.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { SpeedDungeonPlayer } from "../../game/player.js";
import { invariant } from "../../utils/index.js";
import { UserId } from "../sessions/user-ids.js";
import { UserSessionRegistry } from "../sessions/user-session-registry.js";
import { UserSession } from "../sessions/user-session.js";
import { GameServerNodeDirectory } from "./game-server-node-directory.js";

export enum GameSimulatorConnectionType {
  Local,
  Remote,
}

export interface LocalGameSimulatorConnectionInstructions {
  type: GameSimulatorConnectionType.Local;
}

export interface RemoteGameSimulatorConnectionInstructions {
  type: GameSimulatorConnectionType.Remote;
  url: string;
  password: string;
}

export type GameSimulatorConnectionInstructions =
  | LocalGameSimulatorConnectionInstructions
  | RemoteGameSimulatorConnectionInstructions;

export class PendingGameServerUserSession {
  private readonly channelsSubscribedTo = new Set<ChannelName>();

  constructor(
    public readonly userId: UserId,
    public readonly playerUsername: Username,
    public currentGameName: GameName,
    public currentPartyName: PartyName
  ) {}
}

export class GameServerSessionClaimToken {
  readonly expiresAt: number = 0;
  readonly signature: string = ""; // asymmetric signature
  constructor(
    readonly gameName: GameName,
    readonly sessionClaimId: string, // UUID
    // Including this ensures that if a user changed their username or were assigned a different guest
    // username in between disconnecting and reconnecting that they will show as the correct name in the game
    readonly username: string
  ) {}
}

// give the set up game to a GameSimulator either a locally owned GameSimulator
// on the client or send it over websockets to a GameServer which owns a GameSimulator
export interface GameHandoffStrategyLobbyToGameServer {
  handoff(game: SpeedDungeonGame): GameSimulatorConnectionInstructions;
}

export class GameHandoffManager {
  constructor(
    private readonly gameServerNodeDirectory: GameServerNodeDirectory,
    private readonly userSessionRegistry: UserSessionRegistry
  ) {}

  private getPlayerSessionsInGame(game: SpeedDungeonGame) {
    const result = new Map<Username, { session: UserSession; player: SpeedDungeonPlayer }>();

    for (const [username, player] of game.getPlayers()) {
      const existingSessionsByThisPlayerUsername =
        this.userSessionRegistry.getExpectedUserSessions(username);

      const sessionsInGame = existingSessionsByThisPlayerUsername.filter(
        (session) => session.currentGameName === game.name
      );

      const MAX_PERMITTED_USER_SESSIONS_IN_GAME = 1;
      invariant(sessionsInGame.length <= MAX_PERMITTED_USER_SESSIONS_IN_GAME);

      const expectedSessionForThisPlayer = sessionsInGame[0];
      if (expectedSessionForThisPlayer === undefined) {
        throw new Error("expected to have a user session to match the player in game");
      }

      result.set(username, { session: expectedSessionForThisPlayer, player });
    }

    return result;
  }

  private createPendingPlayerSessions(game: SpeedDungeonGame) {
    const sessionsInGameByUsername = this.getPlayerSessionsInGame(game);
    const result = Array.from(sessionsInGameByUsername).map(([username, { session, player }]) => {
      const partyName = player.getExpectedPartyName();
      return new PendingGameServerUserSession(session.userId, username, game.name, partyName);
    });

    return result;
  }

  private createPairedPendingSessionsAndClaimTokens(
    pendingSessions: PendingGameServerUserSession[]
  ): Map<
    ConnectionId,
    { pendingSession: PendingGameServerUserSession; claimToken: GameServerSessionClaimToken }
  > {
    const result = new Map();

    //

    return result;
  }

  // handle a handoff from Lobby to GameServer
  handoffGame(game: SpeedDungeonGame) {
    // - checks existing GameServers for the one with the lowest load
    const targetServerNode = this.gameServerNodeDirectory.getLeastBusyGameServerNode();
    // - adds a local record of the game server in the local game server node registry under it's corresponding node
    // - sends Game to GameServerNode
    // - sends Record<ClaimId, PendingSession> to GameServer
    // - pending session should expire same time as SessionClaim token expires
    // - if no session is claimed within the time window, close the game

    targetServerNode.sendNewGame(game);
    //
    // - sends GameServerAddress to Players
    // - sends GameServerSessionClaimToken to Players
  }
}
