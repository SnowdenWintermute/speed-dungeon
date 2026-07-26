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

  getFloorClearTimes(query: FloorClearTimesQuery): Promise<LadderPage<FloorClearView>>;

  getCumulativeClearTimes(query: CumulativeClearTimesQuery): Promise<LadderPage<FloorClearView>>;

  getWinRateLadder(query: WinRateLadderQuery): Promise<LadderPage<WinRateLadderView>>;

  getCharacterFloorClearSnapshot(
    id: LadderCharacterFloorClearRecordId
  ): Promise<CharacterFloorClearSnapshotView | undefined>;

  getPlayerProfile(username: Username): Promise<PlayerProfileLookup>;

  getUserGameHistory(query: UserGameHistoryQuery): Promise<LadderPage<UserGameHistoryEntry>>;
}
