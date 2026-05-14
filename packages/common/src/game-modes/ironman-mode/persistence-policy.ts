import { AdventuringParty } from "../../adventuring-party/index.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { SpeedDungeonPlayer } from "../../game/player.js";
import { SavedCharactersService } from "../../servers/services/saved-characters.js";
import { GameModePersistencePolicy } from "../persistence-policy.js";

export class ProgressionModePersistencePolicy implements GameModePersistencePolicy {
  constructor(private savedCharactersService: SavedCharactersService) {}
  onGameStart(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  onBattleResult(game: SpeedDungeonGame, party: AdventuringParty): Promise<void> {
    throw new Error("Method not implemented.");
  }
  onFloorDescent(game: SpeedDungeonGame, party: AdventuringParty): Promise<void> {
    throw new Error("Method not implemented.");
  }
  onGameLeave(game: SpeedDungeonGame, player: SpeedDungeonPlayer): Promise<void> {
    throw new Error("Method not implemented.");
  }
  onLastPlayerLeftGame(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  onPartyEscape(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  onPartyWipe(game: SpeedDungeonGame, party: AdventuringParty): Promise<void> {
    throw new Error("Method not implemented.");
  }
  onPartyBattleVictory(): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
