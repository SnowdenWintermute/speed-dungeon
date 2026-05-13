import { CHARACTER_LEVEL_LADDER, EntityId, RankedLadderService } from "@speed-dungeon/common";
import { ValkeyManager } from "../../kv-store/index.js";

export class DatabaseRankedLadderService extends RankedLadderService {
  constructor(private valkeyManager: ValkeyManager) {
    super();
  }

  override async getCurrentRank(ladderName: string, entryId: EntityId): Promise<number | null> {
    const rank = await this.valkeyManager.zRevRank(ladderName, entryId);
    return rank;
  }
  override async updateOrCreateCharacterLevelEntry(
    entryId: EntityId,
    totalExp: number
  ): Promise<{ previousRank: number | null; newRank: number }> {
    const previousRank = await this.valkeyManager.zRevRank(CHARACTER_LEVEL_LADDER, entryId);
    const newRank = await this.valkeyManager.zAdd(CHARACTER_LEVEL_LADDER, [
      { value: entryId, score: totalExp },
    ]);
    return { previousRank, newRank };
  }

  override async removeEntry(ladderName: string, entryId: EntityId): Promise<number> {
    return await this.valkeyManager.zRem(ladderName, [entryId]);
  }
}
