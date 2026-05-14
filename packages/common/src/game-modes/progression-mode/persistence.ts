import { AdventuringParty } from "../../adventuring-party/index.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { SpeedDungeonPlayer } from "../../game/player.js";
import { SavedCharactersService } from "../../servers/services/saved-characters.js";
import { GameModePersistencePolicy } from "../persistence-policy.js";

export class ProgressionModePersistencePolicy implements GameModePersistencePolicy {
  constructor(private savedCharactersService: SavedCharactersService) {}

  onGameStart(): Promise<void> {
    return Promise.resolve();
  }
  async onBattleResult(game: SpeedDungeonGame, party: AdventuringParty): Promise<void> {
    await this.savedCharactersService.updateAllInParty(game, party);
  }
  async onFloorDescent(game: SpeedDungeonGame, party: AdventuringParty): Promise<void> {
    await this.savedCharactersService.updateAllInParty(game, party);
  }
  async onGameLeave(game: SpeedDungeonGame, player: SpeedDungeonPlayer) {
    await this.savedCharactersService.updateCharactersOwnedByPlayerInGame(game, player);
  }
  onLastPlayerLeftGame(): Promise<void> {
    return Promise.resolve();
  }
  onPartyEscape(): Promise<void> {
    return Promise.resolve();
  }
  async onPartyWipe(): Promise<void> {
    return Promise.resolve();
  }
  onPartyVictory(): Promise<void> {
    return Promise.resolve();
  }
}
