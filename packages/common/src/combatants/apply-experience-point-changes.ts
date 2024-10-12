import { AdventuringParty } from "../adventuring-party/index.js";
import { ERROR_MESSAGES } from "../errors/index.js";

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
