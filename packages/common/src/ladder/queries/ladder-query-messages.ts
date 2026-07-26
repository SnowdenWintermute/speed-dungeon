import { LadderCharacterFloorClearRecordId, Username } from "../../aliases.js";
import { LadderPage } from "./ladder-page.js";
import {
  CumulativeClearTimesQuery,
  FloorClearTimesQuery,
  FloorClearView,
} from "./floor-clear-times.js";
import { WinRateLadderQuery, WinRateLadderView } from "./win-rate-ladder.js";
import { CharacterFloorClearSnapshotView } from "./character-floor-clear-snapshot.js";
import { PlayerProfileLookup } from "./player-profile.js";
import { LadderQueries } from "./ladder-queries.js";
import {
  ExperiencePointsLadderQuery,
  ExperiencePointsLadderViewEntry,
} from "./experience-points-ladder.js";
import { UserGameHistoryEntry, UserGameHistoryQuery } from "./user-game-history.js";

// LadderQueries as messages, so every call travels as one intent type and one reply update type
// instead of one of each per query
export enum LadderQueryType {
  ExperiencePointsLadder,
  FloorClearTimes,
  CumulativeClearTimes,
  WinRateLadder,
  CharacterFloorClearSnapshot,
  PlayerProfile,
  UserGameHistory,
}

export type LadderQueryRequest =
  | { type: LadderQueryType.ExperiencePointsLadder; query: ExperiencePointsLadderQuery }
  | { type: LadderQueryType.FloorClearTimes; query: FloorClearTimesQuery }
  | { type: LadderQueryType.CumulativeClearTimes; query: CumulativeClearTimesQuery }
  | { type: LadderQueryType.WinRateLadder; query: WinRateLadderQuery }
  | {
      type: LadderQueryType.CharacterFloorClearSnapshot;
      snapshotId: LadderCharacterFloorClearRecordId;
    }
  | { type: LadderQueryType.PlayerProfile; username: Username }
  | { type: LadderQueryType.UserGameHistory; query: UserGameHistoryQuery };

export type LadderQueryResult =
  | {
      type: LadderQueryType.ExperiencePointsLadder;
      page: LadderPage<ExperiencePointsLadderViewEntry>;
    }
  | { type: LadderQueryType.FloorClearTimes; page: LadderPage<FloorClearView> }
  | { type: LadderQueryType.CumulativeClearTimes; page: LadderPage<FloorClearView> }
  | { type: LadderQueryType.WinRateLadder; page: LadderPage<WinRateLadderView> }
  | {
      type: LadderQueryType.CharacterFloorClearSnapshot;
      snapshotOption?: CharacterFloorClearSnapshotView;
    }
  | { type: LadderQueryType.PlayerProfile; lookup: PlayerProfileLookup }
  | { type: LadderQueryType.UserGameHistory; page: LadderPage<UserGameHistoryEntry> };

export async function executeLadderQuery(
  ladderQueries: LadderQueries,
  request: LadderQueryRequest
): Promise<LadderQueryResult> {
  switch (request.type) {
    case LadderQueryType.ExperiencePointsLadder:
      return {
        type: request.type,
        page: await ladderQueries.getExperiencePointsLadderPage(request.query),
      };
    case LadderQueryType.FloorClearTimes:
      return {
        type: request.type,
        page: await ladderQueries.getFloorClearTimes(request.query),
      };
    case LadderQueryType.CumulativeClearTimes:
      return {
        type: request.type,
        page: await ladderQueries.getCumulativeClearTimes(request.query),
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
    case LadderQueryType.UserGameHistory:
      return {
        type: request.type,
        page: await ladderQueries.getUserGameHistory(request.query),
      };
  }
}
