import { GameName, Seconds, GameServerId, GameServerName, ConnectionId } from "../../aliases.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { ConnectionSession, SessionRegistry } from "./session-registry.js";

// the lobby server's knowledge of status and entry point to communication with game server nodes
export class GameServerSessionRegistry extends SessionRegistry<GameServerSession> {
  onRegister?(session: GameServerSession): undefined;
  onUnregister?(session: GameServerSession): undefined;
  getLeastBusyGameServer(): GameServerSession {
    throw new Error("not implemented");
  }

  public requireNoExistingConnection(gameServerId: GameServerId) {
    for (const [_connectionId, session] of this.sessions) {
      if (session.id === gameServerId) {
        throw new Error("A session already exists for this game server id");
      }
    }
  }
}

// lobby's way to keep track of if a game's heartbeat checkin has been made,
// who has been disconnected in a game, and how long a game has gone on, etc.
// Can also be used for showing UI of ongoing games
class ActiveGameRecord {
  private lastHeartbeatTimestamp: number = Date.now();
  constructor(private readonly game: SpeedDungeonGame) {}

  private static TIME_TO_STALE: Seconds = 60;

  updateHeartbeat() {
    this.lastHeartbeatTimestamp = Date.now();
  }

  get isStale() {
    const elapsedSinceLastHeartbeat = Date.now() - this.lastHeartbeatTimestamp;
    return elapsedSinceLastHeartbeat > ActiveGameRecord.TIME_TO_STALE;
  }
}

export class GameServerSession extends ConnectionSession {
  activeGames = new Map<GameName, ActiveGameRecord>();

  constructor(
    public readonly connectionId: ConnectionId,
    public readonly id: GameServerId,
    public readonly name: GameServerName,
    public readonly url: string
  ) {
    super(connectionId);
  }

  async registerNewActiveGame(game: SpeedDungeonGame) {
    this.activeGames.set(game.name, new ActiveGameRecord(game));
  }
}
