import { GameServerName } from "../../../aliases.js";
import { GameServerStatus } from "./game-server-status.js";

export interface GameServerRegistry {
  /** also serves as the heartbeat: writing a status stamps it as seen just now */
  register(status: GameServerStatus): Promise<void>;
  /** stale statuses are filtered out, not deleted. the lobby's dangling resources
   * cleanup owns removal */
  getLiveServers(): Promise<GameServerStatus[]>;
  getServerByName(name: GameServerName): Promise<GameServerStatus | null>;
  getAllServers(): Promise<GameServerStatus[]>;
  unregister(name: GameServerName): Promise<void>;
}
