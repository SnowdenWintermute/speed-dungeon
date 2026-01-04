import { SpeedDungeonGame } from "../../game/index.js";
import { UserSessionRegistry } from "../sessions/user-session-registry.js";
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

  // handle a handoff from Lobby to GameServer
  handoffGame(game: SpeedDungeonGame) {
    // - checks existing GameServers for the one with the lowest load
    const targetServerNode = this.gameServerNodeDirectory.getLeastBusyGameServerNode();
    // - adds a local record of the game server in the local game server node registry under it's corresponding node
    // - sends Game to GameServerNode
    // - sends Record<ClaimId, PendingSession> to GameServer
    // - pending session should expire same time as SessionClaim token expires
    // - if no session is claimed within the time window, close the game
    for (const [username, player] of Object.entries(game.players)) {
      // const sessionsInGame = this.userSessionRegistry.getExpectedUserSessions(username)
    }
    targetServerNode.sendNewGame(game);
    //
    // - sends GameServerAddress to Players
    // - sends GameServerSessionClaimToken to Players
  }
}
