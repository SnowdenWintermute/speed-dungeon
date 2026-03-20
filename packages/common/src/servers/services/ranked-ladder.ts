import { LadderDeathsUpdate } from "../../action-processing/index.js";
import { EntityId, Username } from "../../aliases.js";
import { Combatant } from "../../combatants/index.js";
import {
  ClientSequentialEvent,
  ClientSequentialEventType,
} from "../../packets/client-sequential-events.js";
import {
  GameMessage,
  GameMessageType,
  createLadderDeathsMessage,
} from "../../packets/game-message.js";

export const CHARACTER_LEVEL_LADDER = "character-level-ladder:";

export abstract class RankedLadderService {
  abstract removeEntry(ladderName: string, entryId: EntityId): Promise<number>;
  abstract getCurrentRank(ladderName: string, entryId: EntityId): Promise<number>;

  abstract updateOrCreateCharacterLevelEntry(
    entryId: EntityId,
    totalExp: number
  ): Promise<{ previousRank: number | null; newRank: number }>;

  async removeDeadCharacters(characters: Combatant[]) {
    const ladderDeathsUpdate: LadderDeathsUpdate = {};

    for (const character of characters) {
      const { combatantProperties } = character;

      const isAlive = !combatantProperties.isDead();
      if (isAlive) {
        continue;
      }

      const rank = await this.getCurrentRank(CHARACTER_LEVEL_LADDER, character.entityProperties.id);
      if (rank === null) {
        continue;
      }

      ladderDeathsUpdate[character.entityProperties.name] = {
        owner: combatantProperties.controlledBy.controllerPlayerName || ("" as Username),
        rank,
        level: combatantProperties.classProgressionProperties.getMainClass().level,
      };

      await this.removeEntry(CHARACTER_LEVEL_LADDER, character.entityProperties.id);
    }

    return ladderDeathsUpdate;
  }

  getTopRankedDeathMessagesActionCommandPayload(
    partyChannelToExclude: string,
    deathsAndRanks: LadderDeathsUpdate
  ): ClientSequentialEvent {
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

    return {
      type: ClientSequentialEventType.PostGameMessages,
      data: { messages, partyChannelToExclude },
    };
  }
}
