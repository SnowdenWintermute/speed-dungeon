import { LadderDeathsUpdate } from "../../action-processing/index.js";
import { EntityId } from "../../aliases.js";
import { Combatant } from "../../combatants/index.js";
import { ClientSequentialEvent } from "../../packets/client-sequential-events.js";
import { RankedLadderService } from "./ranked-ladder.js";

export class InMemoryRankedLadderService extends RankedLadderService {
  override async getCurrentRank(ladderName: string, entryId: EntityId): Promise<number> {
    throw new Error("Method not implemented.");
  }
  override async updateOrCreateCharacterLevelEntry(
    entryId: EntityId,
    totalExp: number
  ): Promise<{ previousRank: number | null; newRank: number }> {
    throw new Error("Method not implemented.");
  }
  override async getTopRankedDeathMessagesActionCommandPayload(
    partyChannelToExclude: string,
    deathsAndRanks: LadderDeathsUpdate
  ): Promise<ClientSequentialEvent> {
    throw new Error("Method not implemented.");
  }
  override async removeEntry(ladderName: string, entryId: EntityId): Promise<number> {
    return 1;
  }
}
