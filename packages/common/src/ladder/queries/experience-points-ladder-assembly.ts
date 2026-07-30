import { EntityId, IdentityProviderId, Username } from "../../aliases.js";
import { ExperiencePointsLadderRankings } from "../../servers/services/experience-points-ladder-service.js";
import { SerializedPlayerCharacter } from "../../servers/services/user-game-data-persistence/serialized-player-character.js";
import { ExperiencePointsLadderViewEntry } from "./experience-points-ladder.js";
import { assembleProgressionCharacterSummary } from "./progression-character-summary-assembly.js";
import { LadderPage, totalPagesOf } from "./ladder-page.js";

// the sorted set decides who is ranked and in what order; every figure on display is read back off
// the character record itself, so a row can never disagree with the character its owner logs in to.
// rankings hold one page's worth of ids, already scored and ordered by the ladder service.
export function assembleExperiencePointsLadderPage(
  rankings: ExperiencePointsLadderRankings,
  page: number,
  pageSize: number,
  charactersById: Map<EntityId, SerializedPlayerCharacter>,
  usernamesByOwnerId: Map<IdentityProviderId, Username>
): LadderPage<ExperiencePointsLadderViewEntry> {
  const pageStart = page * pageSize;
  const entries: ExperiencePointsLadderViewEntry[] = [];

  // a ranked entry we can't describe is dropped rather than thrown over, so one orphan can't take
  // down a page everyone can see. both cases are reportable though: a missing character means the
  // sorted set outlived what it ranks, and a missing username means an account was deleted upstream
  rankings.entryIds.forEach((characterId, indexInPage) => {
    const characterOption = charactersById.get(characterId);
    if (characterOption === undefined) {
      console.info(`ladder entry ${characterId} has no saved character, skipping it`);
      return;
    }
    const usernameOption = usernamesByOwnerId.get(characterOption.ownerId);
    if (usernameOption === undefined) {
      console.info(
        `ladder entry ${characterId} has no resolvable owner (${characterOption.ownerId}), skipping it`
      );
      return;
    }

    entries.push({
      rank: pageStart + indexInPage + 1,
      ...assembleProgressionCharacterSummary(characterOption, usernameOption),
    });
  });

  return {
    page,
    totalPages: totalPagesOf(rankings.totalEntries, pageSize),
    entries,
  };
}

