import { EntityId, RankedLadderService } from "@speed-dungeon/common";
import { ValkeyManager } from "../../kv-store";

export class DatabaseRankedLadderService implements RankedLadderService {
  constructor(private valkeyManager: ValkeyManager) {}
  async removeEntry(ladderName: string, entryId: EntityId): Promise<number> {
    return await this.valkeyManager.zRem(ladderName, [entryId]);
  }
}
