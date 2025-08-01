import { characterSlotsRepo } from "../../database/repos/character-slots.js";
import { Combatant } from "@speed-dungeon/common";
import { playerCharactersRepo } from "../../database/repos/player-characters.js";

export async function fetchSavedCharacters(profileId: number) {
  const slots = await characterSlotsRepo.find("profileId", profileId);
  if (slots === undefined) return new Error("No character slots found");
  const toReturn: { [slot: number]: Combatant } = {};
  const characterPromises: Promise<void>[] = [];
  for (const slot of slots) {
    if (slot.characterId === null) continue;
    characterPromises.push(
      (async () => {
        const character = await playerCharactersRepo.findOne("id", slot.characterId);
        if (character === undefined)
          return console.error("Character slot was holding an id that didn't match any character");

        const combatant = new Combatant(
          { id: character.id, name: character.name },
          character.combatantProperties
        );

        toReturn[slot.slotNumber] = combatant;
      })()
    );
  }
  await Promise.all(characterPromises);

  return toReturn;
}
