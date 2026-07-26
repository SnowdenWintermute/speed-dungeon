import {
  GameId,
  LadderCharacterFloorClearRecordId,
  LadderPartyFloorClearRecordId,
  Username,
} from "../../aliases.js";
import { LadderPage } from "./ladder-page.js";
import {
  CumulativeClearTimesQuery,
  FloorClearTimesQuery,
  FloorClearView,
  RankedFloorClearView,
} from "./floor-clear-times.js";
import { GameRecordView } from "./game-record.js";
import { WinRateLadderQuery, WinRateLadderView } from "./win-rate-ladder.js";
import { CharacterFloorClearSnapshotView } from "./character-floor-clear-snapshot.js";
import { PlayerProfileLookup } from "./player-profile.js";
import {
  ExperiencePointsLadderQuery,
  ExperiencePointsLadderViewEntry,
} from "./experience-points-ladder.js";
import { UserGameHistoryEntry, UserGameHistoryQuery } from "./user-game-history.js";

// the client-facing read side (CQRS-style queries)
export interface LadderQueries {
  getExperiencePointsLadderPage(
    query: ExperiencePointsLadderQuery
  ): Promise<LadderPage<ExperiencePointsLadderViewEntry>>;

  getFloorClearTimes(query: FloorClearTimesQuery): Promise<LadderPage<RankedFloorClearView>>;

  getCumulativeClearTimes(
    query: CumulativeClearTimesQuery
  ): Promise<LadderPage<RankedFloorClearView>>;

  // the individually linkable reads. both answer "show me this one thing", so they take an id rather
  // than a query object, as getCharacterFloorClearSnapshot does
  getFloorClear(id: LadderPartyFloorClearRecordId): Promise<FloorClearView | undefined>;

  getGameRecord(id: GameId): Promise<GameRecordView | undefined>;

  getWinRateLadder(query: WinRateLadderQuery): Promise<LadderPage<WinRateLadderView>>;

  getCharacterFloorClearSnapshot(
    id: LadderCharacterFloorClearRecordId
  ): Promise<CharacterFloorClearSnapshotView | undefined>;

  getPlayerProfile(username: Username): Promise<PlayerProfileLookup>;

  getUserGameHistory(query: UserGameHistoryQuery): Promise<LadderPage<UserGameHistoryEntry>>;
}
