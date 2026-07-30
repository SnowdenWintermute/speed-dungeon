import { Username } from "../../aliases.js";
import { ClassProgressionProperties } from "../../combatants/class-progression-properties.js";
import { SerializedPlayerCharacter } from "../../servers/services/user-game-data-persistence/serialized-player-character.js";
import { compareStringsOrdinally } from "../../utils/index.js";
import { ProgressionCharacterSummaryView } from "./experience-points-ladder.js";

// every figure a listed progression character shows is read off the saved character itself, so a
// ladder row and a row on the owner's own profile can never disagree about the same character
export function assembleProgressionCharacterSummary(
  character: SerializedPlayerCharacter,
  ownerUsername: Username
): ProgressionCharacterSummaryView {
  const classProgression = ClassProgressionProperties.fromSerialized(
    character.combatantProperties.classProgressionProperties
  );
  const mainClass = classProgression.getMainClass();
  const supportClassOption = classProgression.getSupportClassOption();

  return {
    characterId: character.id,
    characterName: character.name,
    ownerUsername,
    totalExperiencePoints: classProgression.totalExperiencePoints,
    mainClass: {
      combatantClass: mainClass.combatantClass,
      level: mainClass.level,
      experiencePoints: classProgression.experiencePoints.getCurrent(),
    },
    supportClassOption:
      supportClassOption === null
        ? undefined
        : { combatantClass: supportClassOption.combatantClass, level: supportClassOption.level },
  };
}

// the ladder orders by rank; a profile has no rank to order by, so it uses the score the ladder
// ranks on. the id breaks ties, as the boards do, so the list is stable
export function byMostExperienced(
  a: ProgressionCharacterSummaryView,
  b: ProgressionCharacterSummaryView
): number {
  return (
    b.totalExperiencePoints - a.totalExperiencePoints ||
    compareStringsOrdinally(a.characterId, b.characterId)
  );
}
