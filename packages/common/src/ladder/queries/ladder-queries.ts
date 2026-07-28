import {
  EntityId,
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
  ExperiencePointsLadderRankQuery,
  ExperiencePointsLadderViewEntry,
  PlayerProgressionCharactersQuery,
  PlayerProgressionCharactersView,
} from "./experience-points-ladder.js";
import { UserGameHistoryEntry, UserGameHistoryQuery } from "./user-game-history.js";
import { ProgressionCharacterView } from "./progression-character.js";

// the client-facing read side (CQRS-style queries)
export interface LadderQueries {
  getExperiencePointsLadderPage(
    query: ExperiencePointsLadderQuery
  ): Promise<LadderPage<ExperiencePointsLadderViewEntry>>;

  getFloorClearTimes(query: FloorClearTimesQuery): Promise<LadderPage<RankedFloorClearView>>;

  getCumulativeClearTimes(
    query: CumulativeClearTimesQuery
  ): Promise<LadderPage<RankedFloorClearView>>;

  // where given rows stand on a board, for a reader who is not on the page they fall on. keyed by id,
  // and anything not on that board is simply absent — a character that died off the ladder, an
  // unknown clear. rank belongs to a board rather than to the row, which is why these are asked
  // separately rather than carried by the character and clear views. batched because a profile asks
  // about all of a player's characters and best clears at once
  getExperiencePointsLadderRanks(
    query: ExperiencePointsLadderRankQuery
  ): Promise<Record<EntityId, number>>;

  getCumulativeClearRanks(
    ids: LadderPartyFloorClearRecordId[]
  ): Promise<Record<LadderPartyFloorClearRecordId, number>>;

  // the individually linkable reads. each answers "show me this one thing", so they take an id rather
  // than a query object, as getCharacterFloorClearSnapshot does
  getFloorClear(id: LadderPartyFloorClearRecordId): Promise<FloorClearView | undefined>;

  getGameRecord(id: GameId): Promise<GameRecordView | undefined>;

  getProgressionCharacter(id: EntityId): Promise<ProgressionCharacterView | undefined>;

  // a player's own characters on one progression ladder, for their profile, with where each of them
  // stands on it — the ids are known by the time this runs, so the ranks come back in the same answer
  getPlayerProgressionCharacters(
    query: PlayerProgressionCharactersQuery
  ): Promise<PlayerProgressionCharactersView>;

  getWinRateLadder(query: WinRateLadderQuery): Promise<LadderPage<WinRateLadderView>>;

  getCharacterFloorClearSnapshot(
    id: LadderCharacterFloorClearRecordId
  ): Promise<CharacterFloorClearSnapshotView | undefined>;

  getPlayerProfile(username: Username): Promise<PlayerProfileLookup>;

  getUserGameHistory(query: UserGameHistoryQuery): Promise<LadderPage<UserGameHistoryEntry>>;
}
