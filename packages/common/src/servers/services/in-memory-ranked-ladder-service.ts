import { EntityId } from "../../aliases.js";
import { invariant } from "../../utils/index.js";
import { CHARACTER_LEVEL_LADDER, RankedLadderService } from "./ranked-ladder.js";

interface LadderEntry {
  entryId: EntityId;
  score: number;
}

interface LadderState {
  scores: Map<EntityId, number>;
  sorted: LadderEntry[] | null; // cached, null means dirty
}

export class InMemoryRankedLadderService extends RankedLadderService {
  private ladders = new Map<string, LadderState>();

  private getOrCreateLadder(ladderName: string): LadderState {
    let ladder = this.ladders.get(ladderName);
    if (!ladder) {
      ladder = {
        scores: new Map(),
        sorted: [],
      };
      this.ladders.set(ladderName, ladder);
    }
    return ladder;
  }

  private ensureSorted(ladder: LadderState): LadderEntry[] {
    if (ladder.sorted === null) {
      ladder.sorted = Array.from(ladder.scores.entries())
        .map(([entryId, score]) => ({ entryId, score }))
        .sort((a, b) => b.score - a.score); // descending like zRevRank
    }
    return ladder.sorted;
  }

  override async getCurrentRank(ladderName: string, entryId: EntityId): Promise<number | null> {
    const ladder = this.ladders.get(ladderName);
    if (!ladder) return null;

    const sorted = this.ensureSorted(ladder);

    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i]?.entryId === entryId) {
        return i; // zero-based rank, matches Redis zRevRank
      }
    }

    return null;
  }

  override async updateOrCreateCharacterLevelEntry(
    entryId: EntityId,
    totalExp: number
  ): Promise<{ previousRank: number | null; newRank: number }> {
    const ladder = this.getOrCreateLadder(CHARACTER_LEVEL_LADDER);

    const previousRank = await this.getCurrentRank(CHARACTER_LEVEL_LADDER, entryId);

    ladder.scores.set(entryId, totalExp);
    ladder.sorted = null; // invalidate cache

    const newRank = await this.getCurrentRank(CHARACTER_LEVEL_LADDER, entryId);
    invariant(newRank !== null);

    return { previousRank, newRank };
  }

  override async removeEntry(ladderName: string, entryId: EntityId): Promise<number> {
    const ladder = this.ladders.get(ladderName);
    if (!ladder) return 0;

    const existed = ladder.scores.delete(entryId);
    if (existed) {
      ladder.sorted = null; // invalidate cache
      return 1; // matches Redis zRem semantics
    }

    return 0;
  }
}
