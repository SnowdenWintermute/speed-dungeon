import { EntityId } from "../../primatives/index.js";

export const CHARACTER_LEVEL_LADDER = "character-level-ladder:";

export interface RankedLadderService {
  removeEntry(ladderName: string, entryId: EntityId): Promise<number>;
}
