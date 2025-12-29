import { characterSlotsRepo } from "../../database/repos/character-slots.js";
import { CharacterSlotIndex, Combatant, CombatantProperties } from "@speed-dungeon/common";
import { playerCharactersRepo } from "../../database/repos/player-characters.js";

export async function fetchSavedCharacters(profileId: number) {
  const slots = await characterSlotsRepo.find("profileId", profileId);
  if (slots === undefined) return new Error("No character slots found");
  const toReturn: Record<CharacterSlotIndex, { combatant: Combatant; pets: Combatant[] }> = {};
  const characterPromises: Promise<void>[] = [];
  for (const slot of slots) {
    if (slot.characterId === null) continue;
    characterPromises.push(
      (async () => {
        const character = await playerCharactersRepo.findOne("id", slot.characterId);

        if (character === undefined) {
          return console.error("Character slot was holding an id that didn't match any character");
        }

        const deserializedCombatantProperties = CombatantProperties.getDeserialized(
          character.combatantProperties
        );

        const combatant = Combatant.createInitialized(
          { id: character.id, name: character.name },
          deserializedCombatantProperties
        );

        const deserializedPets: Combatant[] = [];
        for (const pet of character.pets) {
          const deserializedPet = Combatant.getDeserialized(pet);
          deserializedPets.push(deserializedPet);
        }

        toReturn[slot.slotNumber] = { combatant, pets: deserializedPets };
      })()
    );
  }

  await Promise.all(characterPromises);

  return toReturn;
}
