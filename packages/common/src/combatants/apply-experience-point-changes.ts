import { AdventuringParty } from "../adventuring_party";
import { ERROR_MESSAGES } from "../errors";

export function applyExperiencePointChanges(
  party: AdventuringParty,
  experiencePointChanges: { [combatantId: string]: number }
) {
  console.log(
    "attempting to apply experience point changes: ",
    JSON.stringify(experiencePointChanges)
  );
  for (const [characterId, expChange] of Object.entries(experiencePointChanges)) {
    const character = party.characters[characterId];
    if (character) character.combatantProperties.experiencePoints.current += expChange;
    else return new Error(ERROR_MESSAGES.GAME.CHARACTER_DOES_NOT_EXIST);
  }
}
