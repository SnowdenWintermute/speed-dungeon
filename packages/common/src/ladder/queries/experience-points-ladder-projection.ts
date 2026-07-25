import { EntityId, IdentityProviderId, Username } from "../../aliases.js";
import { LADDER_CONFIG } from "../../app-consts.js";
import { ClassProgressionProperties } from "../../combatants/class-progression-properties.js";
import { ExperiencePointsLadderRankings } from "../../servers/services/ranked-ladder.js";
import { SerializedPlayerCharacter } from "../../servers/services/user-game-data-persistence/serialized-player-character.js";
import { ExperiencePointsLadderViewEntry } from "./experience-points-ladder.js";
import { LadderPage } from "./ladder-page.js";

// the sorted set decides who is ranked and in what order; every figure on display is read back off
// the character record itself, so a row can never disagree with the character its owner logs in to.
// rankings hold one page's worth of ids, already scored and ordered by the ladder service.
export function projectExperiencePointsLadderPage(
  rankings: ExperiencePointsLadderRankings,
  page: number,
  charactersById: Map<EntityId, SerializedPlayerCharacter>,
  usernamesByOwnerId: Map<IdentityProviderId, Username>
): LadderPage<ExperiencePointsLadderViewEntry> {
  const pageStart = page * LADDER_CONFIG.PAGE_SIZE;
  const entries: ExperiencePointsLadderViewEntry[] = [];

  rankings.entryIds.forEach((characterId, indexInPage) => {
    const characterOption = charactersById.get(characterId);
    if (characterOption === undefined) {
      return;
    }
    const usernameOption = usernamesByOwnerId.get(characterOption.ownerId);
    if (usernameOption === undefined) {
      return;
    }

    entries.push(assembleEntry(pageStart + indexInPage + 1, characterOption, usernameOption));
  });

  return {
    page,
    totalPages: Math.ceil(rankings.totalEntries / LADDER_CONFIG.PAGE_SIZE),
    entries,
  };
}

function assembleEntry(
  rank: number,
  character: SerializedPlayerCharacter,
  ownerUsername: Username
): ExperiencePointsLadderViewEntry {
  const classProgression = ClassProgressionProperties.fromSerialized(
    character.combatantProperties.classProgressionProperties
  );
  const mainClass = classProgression.getMainClass();
  const supportClassOption = classProgression.getSupportClassOption();

  return {
    rank,
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
