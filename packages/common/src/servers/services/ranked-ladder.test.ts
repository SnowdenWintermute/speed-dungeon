import { LadderDeathsUpdate, ActionCommandPayload } from "../../action-processing/index.js";
import { EntityId } from "../../aliases.js";
import { Combatant } from "../../combatants/index.js";
import { RankedLadderService } from "./ranked-ladder.js";

describe("ranked ladder service", () => {
  it("", async () => {
    //
  });
});

export class InMemoryRankedLadderService implements RankedLadderService {
  getCurrentRank(ladderName: string, entryId: EntityId): Promise<number> {
    throw new Error("Method not implemented.");
  }
  updateOrCreateCharacterLevelEntry(
    entryId: EntityId,
    totalExp: number
  ): Promise<{ previousRank: number | null; newRank: number }> {
    throw new Error("Method not implemented.");
  }
  removeDeadCharacters(characters: Combatant[]): Promise<LadderDeathsUpdate> {
    throw new Error("Method not implemented.");
  }
  getTopRankedDeathMessagesActionCommandPayload(
    partyChannelToExclude: string,
    deathsAndRanks: LadderDeathsUpdate
  ): ActionCommandPayload {
    throw new Error("Method not implemented.");
  }
  async removeEntry(ladderName: string, entryId: EntityId): Promise<number> {
    return 1;
  }
}
