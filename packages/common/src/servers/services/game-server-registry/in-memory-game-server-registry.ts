import cloneDeep from "lodash.clonedeep";
import { GameServerName } from "../../../aliases.js";
import { GameServerRegistry } from "./index.js";
import { GameServerStatus } from "./game-server-status.js";

export class InMemoryGameServerRegistry implements GameServerRegistry {
  private statuses = new Map<GameServerName, GameServerStatus>();

  async register(status: GameServerStatus): Promise<void> {
    this.statuses.set(status.name, cloneDeep(status));
  }

  async heartbeat(name: GameServerName, activeGameCount: number): Promise<void> {
    const existing = this.statuses.get(name);
    if (existing === undefined) {
      console.info("Tried to heartbeat a GameServerStatus that was not registered");
      return;
    }
    existing.refresh(activeGameCount);
  }

  async getLiveServers(): Promise<GameServerStatus[]> {
    return [...this.statuses.values()]
      .filter((status) => !status.isStale())
      .map((status) => cloneDeep(status));
  }

  async getServerByName(name: GameServerName): Promise<GameServerStatus | null> {
    const existing = this.statuses.get(name);
    if (existing === undefined) {
      return null;
    }
    return cloneDeep(existing);
  }

  async getAllServers(): Promise<GameServerStatus[]> {
    return [...this.statuses.values()].map((status) => cloneDeep(status));
  }

  async unregister(name: GameServerName): Promise<void> {
    this.statuses.delete(name);
  }
}
