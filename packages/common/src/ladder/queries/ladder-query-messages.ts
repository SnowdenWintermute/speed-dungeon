import { LadderCharacterFloorClearRecordId, Username } from "../../aliases.js";
import { LadderPage } from "./ladder-page.js";
import { FloorClearTimesQuery, FloorClearView } from "./floor-clear-times.js";
import { WinRateLadderQuery, WinRateLadderView } from "./win-rate-ladder.js";
import { CharacterFloorClearSnapshotView } from "./character-floor-clear-snapshot.js";
import { PlayerProfileLookup } from "./player-profile.js";
import { LadderQueries } from "./ladder-queries.js";

// LadderQueries as messages, so every call travels as one intent type and one reply update type
// instead of four of each
export enum LadderQueryType {
  FloorClearTimes,
  WinRateLadder,
  CharacterFloorClearSnapshot,
  PlayerProfile,
}

export type LadderQueryRequest =
  | { type: LadderQueryType.FloorClearTimes; query: FloorClearTimesQuery }
  | { type: LadderQueryType.WinRateLadder; query: WinRateLadderQuery }
  | {
      type: LadderQueryType.CharacterFloorClearSnapshot;
      snapshotId: LadderCharacterFloorClearRecordId;
    }
  | { type: LadderQueryType.PlayerProfile; username: Username };

export type LadderQueryResult =
  | { type: LadderQueryType.FloorClearTimes; page: LadderPage<FloorClearView> }
  | { type: LadderQueryType.WinRateLadder; page: LadderPage<WinRateLadderView> }
  | {
      type: LadderQueryType.CharacterFloorClearSnapshot;
      snapshotOption?: CharacterFloorClearSnapshotView;
    }
  | { type: LadderQueryType.PlayerProfile; lookup: PlayerProfileLookup };

export async function executeLadderQuery(
  ladderQueries: LadderQueries,
  request: LadderQueryRequest
): Promise<LadderQueryResult> {
  switch (request.type) {
    case LadderQueryType.FloorClearTimes:
      return {
        type: request.type,
        page: await ladderQueries.getFloorClearTimes(request.query),
      };
    case LadderQueryType.WinRateLadder:
      return {
        type: request.type,
        page: await ladderQueries.getWinRateLadder(request.query),
      };
    case LadderQueryType.CharacterFloorClearSnapshot:
      return {
        type: request.type,
        snapshotOption: await ladderQueries.getCharacterFloorClearSnapshot(request.snapshotId),
      };
    case LadderQueryType.PlayerProfile:
      return {
        type: request.type,
        lookup: await ladderQueries.getPlayerProfile(request.username),
      };
  }
}
