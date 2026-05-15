import { AdventuringParty } from "../../adventuring-party/index.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { SpeedDungeonPlayer } from "../../game/player.js";
import { SavedCharactersService } from "../../servers/services/saved-characters.js";
import { GameModePersistencePolicy } from "../persistence-policy.js";

export class IronmanModePersistencePolicy implements GameModePersistencePolicy {
  constructor(private savedCharactersService: SavedCharactersService) {}
  onGameStart(): Promise<void> {
    // save the run in persitence service
    // save the run id in each account's ironman run slots
    throw new Error("Method not implemented.");
  }

  async onBattleResult(game: SpeedDungeonGame, party: AdventuringParty): Promise<void> {
    return;
  }

  async onFloorDescent(game: SpeedDungeonGame, party: AdventuringParty): Promise<void> {
    // save the game
    throw new Error("Method not implemented.");
  }

  async onGameLeave(game: SpeedDungeonGame, player: SpeedDungeonPlayer): Promise<void> {
    // - if any living characters remain, save the run
    // - disconnect other remaining players
    throw new Error("Method not implemented.");
  }

  async onLastPlayerLeftGame(): Promise<void> {
    return;
  }

  async onPartyEscape(): Promise<void> {
    // delete the run from persistence
    throw new Error("Method not implemented.");
  }

  async onPartyWipe(game: SpeedDungeonGame, party: AdventuringParty): Promise<void> {
    // delete the run from persistence
    throw new Error("Method not implemented.");
  }

  async onPartyBattleVictory(): Promise<void> {
    return;
  }
}
