import { AdventuringParty, PlayerCharacter } from "./adventuring_party";
import { CombatantDetails } from "./combatants";
import { SpeedDungeonGame } from "./game";

export interface CharacterAssociatedData {
  game: SpeedDungeonGame;
  party: AdventuringParty;
  character: PlayerCharacter;
}

export interface CombatantAssociatedData {
  game: SpeedDungeonGame;
  party: AdventuringParty;
  combatant: CombatantDetails;
}
