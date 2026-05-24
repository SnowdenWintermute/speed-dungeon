import { Combatant } from "../../../combatants/index.js";
import { EntityId, IdentityProviderId } from "../../../aliases.js";
import { CharacterControlScheme } from "../../../game-modes/index.js";
import { SerializedPlayerCharacter } from "./serialized-player-character.js";

export interface SavedCharacterPersistenceStrategy {
  fetchCharacter: (characterId: EntityId) => Promise<SerializedPlayerCharacter>;
  findByOwnerAndControlScheme: (
    ownerId: IdentityProviderId,
    controlScheme: CharacterControlScheme
  ) => Promise<SerializedPlayerCharacter[]>;
  insert: (
    combatant: Combatant,
    pets: Combatant[],
    ownerId: IdentityProviderId,
    controlScheme: CharacterControlScheme
  ) => Promise<SerializedPlayerCharacter>;
  update: (combatant: Combatant, pets: Combatant[]) => Promise<SerializedPlayerCharacter>;
  delete: (id: number | string) => Promise<SerializedPlayerCharacter>;
}
