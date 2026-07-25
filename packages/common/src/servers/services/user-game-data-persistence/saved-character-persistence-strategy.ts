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
  // for reads that start from a list of character ids rather than from an owner, such as hydrating a
  // page of the experience points ladder. missing ids are simply absent from the result
  findByIds: (characterIds: EntityId[]) => Promise<SerializedPlayerCharacter[]>;
  insert: (
    combatant: Combatant,
    pets: Combatant[],
    ownerId: IdentityProviderId,
    controlScheme: CharacterControlScheme
  ) => Promise<SerializedPlayerCharacter>;
  update: (combatant: Combatant, pets: Combatant[]) => Promise<SerializedPlayerCharacter>;
  delete: (id: number | string) => Promise<SerializedPlayerCharacter>;
}
