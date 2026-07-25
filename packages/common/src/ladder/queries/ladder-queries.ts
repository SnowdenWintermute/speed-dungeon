import { LadderCharacterFloorClearRecordId, Username } from "../../aliases.js";
import { LadderPage } from "./ladder-page.js";
import { FloorClearTimesQuery, FloorClearView } from "./floor-clear-times.js";
import { WinRateLadderQuery, WinRateLadderView } from "./win-rate-ladder.js";
import { CharacterFloorClearSnapshotView } from "./character-floor-clear-snapshot.js";
import { PlayerProfileView } from "./player-profile.js";

// the client-facing read side (CQRS-style queries). getExperiencePointsLadder belongs here too, but
// its data source was removed to be rebuilt over progression characters (increment step 8)
export interface LadderQueries {
  getFloorClearTimes(query: FloorClearTimesQuery): Promise<LadderPage<FloorClearView>>;

  getWinRateLadder(query: WinRateLadderQuery): Promise<LadderPage<WinRateLadderView>>;

  getCharacterFloorClearSnapshot(
    id: LadderCharacterFloorClearRecordId
  ): Promise<CharacterFloorClearSnapshotView | undefined>;

  getPlayerProfile(username: Username): Promise<PlayerProfileView | undefined>;
}
