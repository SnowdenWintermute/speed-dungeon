import { AdventuringParty, PlayerCharacter } from "./adventuring_party";
import { SpeedDungeonGame } from "./game";

export interface CharacterAssociatedData {
  game: SpeedDungeonGame;
  party: AdventuringParty;
  character: PlayerCharacter;
}
