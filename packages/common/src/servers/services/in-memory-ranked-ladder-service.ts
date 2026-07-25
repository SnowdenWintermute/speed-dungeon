import { EntityId } from "../../aliases.js";
import { CharacterLevelLadderService, ExperiencePointsLadderRankings } from "./ranked-ladder.js";

interface LadderEntry {
  entryId: EntityId;
  score: number;
}

interface LadderState {
  scores: Map<EntityId, number>;
  sorted: LadderEntry[] | null; // cached, null means dirty
}

export class InMemoryCharacterLevelLadderService extends CharacterLevelLadderService {
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
        // descending like zRevRank, which breaks ties in reverse lexicographic order of the member
        .sort((a, b) => b.score - a.score || b.entryId.localeCompare(a.entryId));
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

  override async setScore(
    ladderName: string,
    entryId: EntityId,
    totalExperiencePoints: number
  ): Promise<void> {
    const ladder = this.getOrCreateLadder(ladderName);
    ladder.scores.set(entryId, totalExperiencePoints);
    ladder.sorted = null; // invalidate cache
  }

  override async getRankedPage(
    ladderName: string,
    page: number,
    pageSize: number
  ): Promise<ExperiencePointsLadderRankings> {
    const ladder = this.ladders.get(ladderName);
    if (!ladder) return { entryIds: [], totalEntries: 0 };

    const sorted = this.ensureSorted(ladder);
    const pageStart = page * pageSize;

    return {
      entryIds: sorted.slice(pageStart, pageStart + pageSize).map((entry) => entry.entryId),
      totalEntries: sorted.length,
    };
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
