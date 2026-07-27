import { Username } from "../../aliases.js";
import { CharacterControlScheme } from "../../game-modes/index.js";
import { SerializedCombatantWithPets } from "../../servers/services/user-game-data-persistence/serialized-combatant-with-pets.js";

// the page an experience points ladder row links to: the character as it stands right now, read off
// the saved character itself rather than any record made about it. carries the whole build —
// equipment, attributes, abilities, pets — minus the inventory, which is a lot of bytes for something
// nobody opened this page to see. the character's id and name travel inside the combatant, which is
// where every other reader of a serialized combatant already looks for them
export interface ProgressionCharacterView {
  ownerUsername: Username;
  controlScheme: CharacterControlScheme;
  combatantWithPets: SerializedCombatantWithPets;
}
