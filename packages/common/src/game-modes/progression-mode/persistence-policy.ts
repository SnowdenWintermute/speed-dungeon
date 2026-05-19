import { AdventuringParty } from "../../adventuring-party/index.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { SpeedDungeonPlayer } from "../../game/player.js";
import { UserGameDataPersistenceService } from "../../servers/services/user-game-data-persistence/index.js";
import { GameModePersistencePolicy } from "../persistence-policy.js";

export class ProgressionModePersistencePolicy implements GameModePersistencePolicy {
  constructor(private userGameDataPersistenceService: UserGameDataPersistenceService) {}

  onGameStart(): Promise<void> {
    return Promise.resolve();
  }

  async onBattleResult(game: SpeedDungeonGame, party: AdventuringParty): Promise<void> {
    await this.userGameDataPersistenceService.updateAllInParty(game, party);
  }

  async onFloorDescent(game: SpeedDungeonGame, party: AdventuringParty): Promise<void> {
    await this.userGameDataPersistenceService.updateAllInParty(game, party);
  }

  async onLiveGameLeave(game: SpeedDungeonGame, player: SpeedDungeonPlayer) {
    await this.userGameDataPersistenceService.updateCharactersOwnedByPlayerInGame(game, player);
  }

  onLastPlayerLeftLiveGame(): Promise<void> {
    return Promise.resolve();
  }

  onPartyEscape(): Promise<void> {
    return Promise.resolve();
  }

  async onPartyWipe(): Promise<void> {
    return Promise.resolve();
  }

  onPartyBattleVictory(): Promise<void> {
    return Promise.resolve();
  }
}
