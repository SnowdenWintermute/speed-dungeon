import { GameServerName } from "../../../aliases.js";
import { ERROR_MESSAGES } from "../../../errors/index.js";
import { GameServerRegistry } from "../../services/game-server-registry/index.js";
import { GameSessionStoreService } from "../../services/game-session-store/index.js";

export class LeastBusyGameServerSelector {
  constructor(
    private readonly gameServerRegistry: GameServerRegistry,
    private readonly gameSessionStoreService: GameSessionStoreService
  ) {}

  async select(): Promise<{ name: GameServerName; url: string }> {
    const liveServers = await this.gameServerRegistry.getLiveServers();
    const gameCounts = await this.countGamesByServerName();

    let selectedOption: null | { name: GameServerName; url: string; gameCount: number } = null;

    for (const server of liveServers) {
      const gameCount = gameCounts.get(server.name) ?? 0;
      if (selectedOption === null || gameCount < selectedOption.gameCount) {
        selectedOption = { name: server.name, url: server.url, gameCount };
      }
    }

    if (selectedOption === null) {
      throw new Error(ERROR_MESSAGES.SERVERS.NO_LIVE_GAME_SERVERS);
    }

    return { name: selectedOption.name, url: selectedOption.url };
  }

  /** pending setups count too. a handed off game is not registered on its game server until
   * the first player connects, so counting only active games would send rapid successive
   * games to the same server */
  private async countGamesByServerName() {
    const counts = new Map<GameServerName, number>();

    const activeGames = await this.gameSessionStoreService.getActiveGames();
    const pendingSetups = await this.gameSessionStoreService.getPendingGameSetups();

    for (const record of [...activeGames, ...pendingSetups]) {
      const current = counts.get(record.hostingServerName) ?? 0;
      counts.set(record.hostingServerName, current + 1);
    }

    return counts;
  }
}
