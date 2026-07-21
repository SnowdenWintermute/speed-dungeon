import { GameServerName, GameServerRegistry, GameServerStatus } from "@speed-dungeon/common";
import { ValkeyManager } from "../kv-store/valkey-manager.js";

const GAME_SERVER_STATUSES_HASH = "game-server-registry:servers";

export class ValkeyGameServerRegistry implements GameServerRegistry {
  constructor(private readonly valkeyManager: ValkeyManager) {}

  async register(status: GameServerStatus): Promise<void> {
    await this.write(status);
  }

  async heartbeat(name: GameServerName, activeGameCount: number): Promise<void> {
    const existing = await this.getServerByName(name);
    if (existing === null) {
      console.info("Tried to heartbeat a GameServerStatus that was not registered");
      return;
    }
    existing.refresh(activeGameCount);
    await this.write(existing);
  }

  async getLiveServers(): Promise<GameServerStatus[]> {
    const all = await this.getAllServers();
    return all.filter((status) => !status.isStale());
  }

  async getServerByName(name: GameServerName): Promise<GameServerStatus | null> {
    const raw = await this.valkeyManager.hGet(GAME_SERVER_STATUSES_HASH, name);
    if (raw == null) {
      return null;
    }
    return GameServerStatus.fromSerialized(JSON.parse(raw));
  }

  async getAllServers(): Promise<GameServerStatus[]> {
    const all = await this.valkeyManager.hGetAll(GAME_SERVER_STATUSES_HASH);
    return Object.values(all).map((raw) => GameServerStatus.fromSerialized(JSON.parse(raw)));
  }

  async unregister(name: GameServerName): Promise<void> {
    await this.valkeyManager.hDel(GAME_SERVER_STATUSES_HASH, name);
  }

  private async write(status: GameServerStatus) {
    await this.valkeyManager.hSet(
      GAME_SERVER_STATUSES_HASH,
      status.name,
      JSON.stringify(status.toSerialized())
    );
  }
}
