import { EntityId } from "../../aliases.js";
import { RankedLadderService } from "./ranked-ladder.js";

describe("ranked ladder service", () => {
  it("", async () => {
    //
  });
});

export class InMemoryRankedLadderService implements RankedLadderService {
  async removeEntry(ladderName: string, entryId: EntityId): Promise<number> {
    return 1;
  }
}
