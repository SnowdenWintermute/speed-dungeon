import {
  EntityId,
  ExperiencePointsLadderRankings,
  ExperiencePointsLadderService,
} from "@speed-dungeon/common";
import { ValkeyManager } from "../../kv-store/index.js";

export class DatabaseExperiencePointsLadderService extends ExperiencePointsLadderService {
  constructor(private valkeyManager: ValkeyManager) {
    super();
  }

  override async getEntryIndex(ladderName: string, entryId: EntityId): Promise<number | null> {
    return this.valkeyManager.zRevRank(ladderName, entryId);
  }

  override async setScore(
    ladderName: string,
    entryId: EntityId,
    totalExperiencePoints: number
  ): Promise<void> {
    await this.valkeyManager.zAdd(ladderName, [{ value: entryId, score: totalExperiencePoints }]);
  }

  override async getRankedPage(
    ladderName: string,
    page: number,
    pageSize: number
  ): Promise<ExperiencePointsLadderRankings> {
    const pageStart = page * pageSize;
    const entryIds = await this.valkeyManager.zRange(
      ladderName,
      pageStart,
      pageStart + pageSize - 1,
      { REV: true }
    );
    const totalEntries = await this.valkeyManager.zCard(ladderName);

    return { entryIds, totalEntries };
  }

  override async removeEntry(ladderName: string, entryId: EntityId): Promise<number> {
    return await this.valkeyManager.zRem(ladderName, [entryId]);
  }
}
