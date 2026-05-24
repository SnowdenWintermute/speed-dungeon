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

  async fetchCharacter(characterId: EntityId): Promise<SerializedPlayerCharacter> {
    const expected = this.savedCharacters.get(characterId);
    if (expected === undefined) {
      throw new Error(ERROR_MESSAGES.USER.SAVED_CHARACTER_NOT_FOUND);
    }
    return expected;
  }

  async findByOwnerAndControlScheme(
    ownerId: IdentityProviderId,
    controlScheme: CharacterControlScheme
  ): Promise<SerializedPlayerCharacter[]> {
    const matches: SerializedPlayerCharacter[] = [];
    for (const character of this.savedCharacters.values()) {
      if (character.ownerId === ownerId && character.controlScheme === controlScheme) {
        matches.push(character);
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
    const serialized = new SerializedPlayerCharacter(combatant, pets, ownerId, controlScheme);
    this.savedCharacters.set(serialized.id, serialized);
    return serialized;
  }

  async update(combatant: Combatant, pets: Combatant[]): Promise<SerializedPlayerCharacter> {
    const expected = await this.fetchCharacter(combatant.getEntityId());
    expected.combatantProperties = combatant.combatantProperties.toSerialized();
    expected.pets = pets.map((pet) => pet.toSerialized());
    return expected;
  }

  async delete(id: number | string): Promise<SerializedPlayerCharacter> {
    const expected = await this.fetchCharacter(id as EntityId);
    this.savedCharacters.delete(id as EntityId);
    return expected;
  }
}
