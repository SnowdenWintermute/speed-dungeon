import cloneDeep from "lodash.clonedeep";
import { EntityId, IdentityProviderId } from "../../../aliases.js";
import { Combatant } from "../../../combatants/index.js";
import { ERROR_MESSAGES } from "../../../errors/index.js";
import { CharacterControlScheme } from "../../../game-modes/index.js";
import { SavedCharacterPersistenceStrategy } from "./saved-character-persistence-strategy.js";
import { SerializedPlayerCharacter } from "./serialized-player-character.js";

export class InMemorySavedCharacterPersistenceStrategy
  implements SavedCharacterPersistenceStrategy
{
  private readonly savedCharacters = new Map<EntityId, SerializedPlayerCharacter>();

  // clone on read/write to emulate a real DB's serialize boundary. toSerialized leaks live
  // references (e.g. speccedAttributes), so without cloning the stored record would alias and
  // reflect later mutations of the live combatant.
  async fetchCharacter(characterId: EntityId): Promise<SerializedPlayerCharacter> {
    const expected = this.savedCharacters.get(characterId);
    if (expected === undefined) {
      throw new Error(ERROR_MESSAGES.USER.SAVED_CHARACTER_NOT_FOUND);
    }
    return cloneDeep(expected);
  }

  async findByOwnerAndControlScheme(
    ownerId: IdentityProviderId,
    controlScheme: CharacterControlScheme
  ): Promise<SerializedPlayerCharacter[]> {
    const matches: SerializedPlayerCharacter[] = [];
    for (const character of this.savedCharacters.values()) {
      if (character.ownerId === ownerId && character.controlScheme === controlScheme) {
        matches.push(cloneDeep(character));
      }
    }
    return matches;
  }

  async insert(
    combatant: Combatant,
    pets: Combatant[],
    ownerId: IdentityProviderId,
    controlScheme: CharacterControlScheme
  ): Promise<SerializedPlayerCharacter> {
    const serialized = cloneDeep(
      new SerializedPlayerCharacter(combatant, pets, ownerId, controlScheme)
    );
    this.savedCharacters.set(serialized.id, serialized);
    return cloneDeep(serialized);
  }

  async update(combatant: Combatant, pets: Combatant[]): Promise<SerializedPlayerCharacter> {
    const stored = this.savedCharacters.get(combatant.getEntityId());
    if (stored === undefined) {
      throw new Error(ERROR_MESSAGES.USER.SAVED_CHARACTER_NOT_FOUND);
    }
    stored.combatantProperties = cloneDeep(combatant.combatantProperties.toSerialized());
    stored.pets = pets.map((pet) => cloneDeep(pet.toSerialized()));
    return cloneDeep(stored);
  }

  async delete(id: number | string): Promise<SerializedPlayerCharacter> {
    const expected = await this.fetchCharacter(id as EntityId);
    this.savedCharacters.delete(id as EntityId);
    return expected;
  }
}
