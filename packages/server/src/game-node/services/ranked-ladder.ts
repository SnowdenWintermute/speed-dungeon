import {
  ClientSequentialEvent,
  Combatant,
  EntityId,
  LadderDeathsUpdate,
  RankedLadderService,
} from "@speed-dungeon/common";
import { ValkeyManager } from "../../kv-store/index.js";

export class DatabaseRankedLadderService implements RankedLadderService {
  constructor(private valkeyManager: ValkeyManager) {}
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
  ): ClientSequentialEvent {
    throw new Error("Method not implemented.");
  }
  async removeEntry(ladderName: string, entryId: EntityId): Promise<number> {
    return await this.valkeyManager.zRem(ladderName, [entryId]);
  }
}
