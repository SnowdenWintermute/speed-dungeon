import { ChannelName, GameName, PartyName, ServerNodeId, Username } from "../../aliases.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { SpeedDungeonPlayer } from "../../game/player.js";
import { UserId } from "../sessions/user-ids.js";

class PendingGameServerUserSession {
  private readonly channelsSubscribedTo = new Set<ChannelName>();

  constructor(
    public readonly userId: UserId,
    public currentGameName: GameName,
    public currentPartyName: PartyName
  ) {}
}

// lobby's way to keep track of if a game's heartbeat checkin has been made,
// who has been disconnected in a game, and how long a game has gone on, etc.
// Can also be used for showing UI of ongoing games
class ActiveGameRecord {
  constructor(private readonly game: SpeedDungeonGame) {}
}

class GameServerNodeHandle {
  activeGames = new Map<GameName, ActiveGameRecord>();

  constructor(
    public readonly id: ServerNodeId,
    public readonly url: string
  ) {}

  private transmitGameToNode(game: SpeedDungeonGame) {
    // @TODO - use a parameterized strategy
  }

  private createPendingPlayerSessions(players: Record<Username, SpeedDungeonPlayer>) {
    // const result = Object.entries(players)
    //   .map
    // ([username, player]) => new PendingGameServerUserSession()
    // ();
  }

  sendNewGame(game: SpeedDungeonGame) {
    // - adds a local record of the game server in the local game server node registry under it's corresponding node
    this.activeGames.set(game.name, new ActiveGameRecord(game));
    // - sends Game to GameServerNode
    this.transmitGameToNode(game);
    // - sends Record<ClaimId, PendingSession> to GameServer
    const pendingSessions = this.createPendingPlayerSessions(game.players);
    // - pending session should expire same time as SessionClaim token expires
    // - if no session is claimed within the time window, close the game
  }
}

const DEFAULT_GAME_SERVER_NODE_ID = "default-game-server-node" as ServerNodeId;

// the lobby server's knowledge of status and entry point to communication with game server nodes
export class GameServerNodeDirectory {
  private handles = new Map<ServerNodeId, GameServerNodeHandle>();
  constructor() {
    this.handles.set(
      DEFAULT_GAME_SERVER_NODE_ID,
      new GameServerNodeHandle(DEFAULT_GAME_SERVER_NODE_ID, "")
    );
  }

  private getExpectedGameServerNode(id: ServerNodeId) {
    const expected = this.handles.get(id);
    if (expected === undefined) {
      throw new Error("expected game server node not found");
    }
    return expected;
  }

  getLeastBusyGameServerNode(): GameServerNodeHandle {
    return this.getExpectedGameServerNode(DEFAULT_GAME_SERVER_NODE_ID);
  }
}
