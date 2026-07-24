import { LadderCharacterFloorClearRecordId, Username } from "../../aliases.js";
import { LadderPage } from "./ladder-page.js";
import {
  ExperiencePointsLadderQuery,
  ExperiencePointsLadderView,
} from "./experience-points-ladder.js";
import { FloorClearTimesQuery, FloorClearView } from "./floor-clear-times.js";
import { WinRateLadderQuery, WinRateLadderView } from "./win-rate-ladder.js";
import { CharacterFloorClearSnapshotView } from "./character-floor-clear-snapshot.js";
import { PlayerProfileView } from "./player-profile.js";

// the client-facing read side (CQRS-style queries) for the ladder. speaks Username, never
// IdentityProviderId — the client neither knows nor should see the internal identity key. the
// online impl resolves username -> id server-side per query and maps back to usernames in the
// response; the offline impl reads an IndexedDB-backed strategy directly. returns View data
// (display-shaped), distinct from the record shapes the persistence layer writes.
export interface LadderQueries {
  getExperiencePointsLadder(
    query: ExperiencePointsLadderQuery
  ): Promise<LadderPage<ExperiencePointsLadderView>>;

  getFloorClearTimes(query: FloorClearTimesQuery): Promise<LadderPage<FloorClearView>>;

  getWinRateLadder(query: WinRateLadderQuery): Promise<LadderPage<WinRateLadderView>>;

  getCharacterFloorClearSnapshot(
    id: LadderCharacterFloorClearRecordId
  ): Promise<CharacterFloorClearSnapshotView | undefined>;

  getPlayerProfile(username: Username): Promise<PlayerProfileView | undefined>;
}
