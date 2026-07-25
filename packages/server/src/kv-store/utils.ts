import {
  CHARACTER_CONTROL_SCHEME_STRINGS,
  calculateTotalExperience,
  experiencePointsLadderName,
  invariant,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import { valkeyManager } from "./index.js";
import { playerCharactersRepo } from "../database/repos/player-characters.js";

export async function loadLadderIntoKvStore() {
  const rows = await playerCharactersRepo.getAllCharacterExperienceScores();
  if (!rows) {
    return console.error("Couldn't load character levels");
  }

  const entriesByLadderName = new Map<string, { value: string; score: number }[]>();
  for (const [controlScheme] of iterateNumericEnumKeyedRecord(CHARACTER_CONTROL_SCHEME_STRINGS)) {
    entriesByLadderName.set(experiencePointsLadderName(controlScheme), []);
  }

  for (const character of rows) {
    if (character.hitPoints <= 0) {
      continue; // only allow living characters in the ladder
    }
    const score = calculateTotalExperience(character.level) + character.experiencePoints;
    if (score === 0) {
      continue; // don't flood the list with characters who have never earned anything
    }
    const entries = entriesByLadderName.get(experiencePointsLadderName(character.controlScheme));
    invariant(entries !== undefined, "every control scheme has a ladder");
    entries.push({ value: character.id, score });
  }

  for (const [ladderName, entries] of entriesByLadderName) {
    await valkeyManager.context.del(ladderName);
    if (entries.length === 0) {
      continue;
    }
    await valkeyManager.context.zAdd(ladderName, entries);
  }
}
