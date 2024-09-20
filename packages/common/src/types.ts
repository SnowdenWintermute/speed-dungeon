import { AdventuringParty, PlayerCharacter } from "./adventuring_party/index.js";
import { CombatantDetails } from "./combatants/index.js";
import { SpeedDungeonGame } from "./game/index.js";

export interface CharacterAssociatedData {
  username: string;
  game: SpeedDungeonGame;
  party: AdventuringParty;
  character: PlayerCharacter;
}

export interface CombatantAssociatedData {
  game: SpeedDungeonGame;
  party: AdventuringParty;
  combatant: CombatantDetails;
}

export interface PlayerAssociatedData {
  username: string;
  game: SpeedDungeonGame;
  party: AdventuringParty;
}
