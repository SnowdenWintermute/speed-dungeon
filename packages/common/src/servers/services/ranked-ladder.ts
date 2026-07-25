import { LadderDeathsUpdate } from "../../action-processing/index.js";
import { EntityId, Username } from "../../aliases.js";
import { Combatant } from "../../combatants/index.js";
import { CharacterControlScheme } from "../../game-modes/index.js";
import {
  GameMessage,
  GameMessageType,
  createLadderDeathsMessage,
} from "../../packets/game-message.js";
import { invariant } from "../../utils/index.js";

// not exported: the prefix alone is not a key, and using it as one would address a set nothing
// writes to. experiencePointsLadderName is the only way to name a ladder
const EXPERIENCE_POINTS_LADDER = "experience-points-ladder:";

// key fragments of their own rather than the display strings, so renaming what a scheme is called
// never re-keys a live sorted set
const CONTROL_SCHEME_LADDER_KEY_FRAGMENTS: Record<CharacterControlScheme, string> = {
  [CharacterControlScheme.Freelancer]: "freelancer",
  [CharacterControlScheme.Captain]: "captain",
};

/** Each control scheme ranks on its own sorted set. There is no combined ladder — the schemes play
 * differently enough that one ranking across them wouldn't mean anything. */
export function experiencePointsLadderName(controlScheme: CharacterControlScheme): string {
  return EXPERIENCE_POINTS_LADDER + CONTROL_SCHEME_LADDER_KEY_FRAGMENTS[controlScheme];
}

export interface ExperiencePointsLadderRankings {
  entryIds: EntityId[];
  totalEntries: number;
}

export abstract class CharacterLevelLadderService {
  abstract getCurrentRank(ladderName: string, entryId: EntityId): Promise<number | null>;
  abstract setScore(
    ladderName: string,
    entryId: EntityId,
    totalExperiencePoints: number
  ): Promise<void>;
  abstract removeEntry(ladderName: string, entryId: EntityId): Promise<number>;
  /** highest score first, as a zero-based page of ranked entry ids */
  abstract getRankedPage(
    ladderName: string,
    page: number,
    pageSize: number
  ): Promise<ExperiencePointsLadderRankings>;

  async updateOrCreateCharacterLevelEntry(
    entryId: EntityId,
    totalExperiencePoints: number,
    controlScheme: CharacterControlScheme
  ): Promise<{ previousRank: number | null; newRank: number }> {
    const ladderName = experiencePointsLadderName(controlScheme);

    const previousRank = await this.getCurrentRank(ladderName, entryId);
    await this.setScore(ladderName, entryId, totalExperiencePoints);
    const newRank = await this.getCurrentRank(ladderName, entryId);
    invariant(newRank !== null);

    return { previousRank, newRank };
  }

  async removeDeadCharacters(characters: Combatant[], controlScheme: CharacterControlScheme) {
    const ladderDeathsUpdate: LadderDeathsUpdate = {};
    const ladderName = experiencePointsLadderName(controlScheme);

    for (const character of characters) {
      const { combatantProperties } = character;

      const isAlive = !combatantProperties.isDead();
      if (isAlive) {
        continue;
      }

      const rank = await this.getCurrentRank(ladderName, character.entityProperties.id);
      if (rank === null) {
        continue;
      }

      ladderDeathsUpdate[character.entityProperties.name] = {
        owner: combatantProperties.controlledBy.controllerPlayerName || ("" as Username),
        rank,
        level: combatantProperties.classProgressionProperties.getMainClass().level,
      };

      await this.removeEntry(ladderName, character.entityProperties.id);
    }

    return ladderDeathsUpdate;
  }

  async getTopRankedDeathMessages(deathsAndRanks: LadderDeathsUpdate): Promise<GameMessage[]> {
    const messages = Object.entries(deathsAndRanks).map(([characterName, deathAndRank]) => {
      return new GameMessage(
        GameMessageType.LadderDeath,
        true,
        createLadderDeathsMessage(
          characterName,
          deathAndRank.owner,
          deathAndRank.level,
          deathAndRank.rank
        )
      );
    });

    return messages;
  }
}
