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
import { LadderQueries } from "./ladder-queries.js";
import {
  ExperiencePointsLadderQuery,
  ExperiencePointsLadderRankQuery,
  ExperiencePointsLadderViewEntry,
  PlayerProgressionCharactersQuery,
  PlayerProgressionCharactersView,
} from "./experience-points-ladder.js";
import { UserGameHistoryEntry, UserGameHistoryQuery } from "./user-game-history.js";
import { ProgressionCharacterView } from "./progression-character.js";

// LadderQueries as messages, so every call travels as one intent type and one reply update type
// instead of one of each per query
export enum LadderQueryType {
  ExperiencePointsLadder,
  ExperiencePointsLadderRanks,
  FloorClearTimes,
  CumulativeClearTimes,
  CumulativeClearRanks,
  FloorClear,
  GameRecord,
  ProgressionCharacter,
  PlayerProgressionCharacters,
  WinRateLadder,
  CharacterFloorClearSnapshot,
  PlayerProfile,
  UserGameHistory,
}

export type LadderQueryRequest =
  | { type: LadderQueryType.ExperiencePointsLadder; query: ExperiencePointsLadderQuery }
  | { type: LadderQueryType.ExperiencePointsLadderRanks; query: ExperiencePointsLadderRankQuery }
  | { type: LadderQueryType.FloorClearTimes; query: FloorClearTimesQuery }
  | { type: LadderQueryType.CumulativeClearTimes; query: CumulativeClearTimesQuery }
  | { type: LadderQueryType.CumulativeClearRanks; floorClearIds: LadderPartyFloorClearRecordId[] }
  | { type: LadderQueryType.FloorClear; floorClearId: LadderPartyFloorClearRecordId }
  | { type: LadderQueryType.GameRecord; gameRecordId: GameId }
  | { type: LadderQueryType.ProgressionCharacter; characterId: EntityId }
  | {
      type: LadderQueryType.PlayerProgressionCharacters;
      query: PlayerProgressionCharactersQuery;
    }
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
  | { type: LadderQueryType.ExperiencePointsLadderRanks; ranksById: Record<EntityId, number> }
  | { type: LadderQueryType.FloorClearTimes; page: LadderPage<RankedFloorClearView> }
  | { type: LadderQueryType.CumulativeClearTimes; page: LadderPage<RankedFloorClearView> }
  | {
      type: LadderQueryType.CumulativeClearRanks;
      ranksById: Record<LadderPartyFloorClearRecordId, number>;
    }
  | { type: LadderQueryType.FloorClear; floorClearOption?: FloorClearView }
  | { type: LadderQueryType.GameRecord; gameRecordOption?: GameRecordView }
  | { type: LadderQueryType.ProgressionCharacter; characterOption?: ProgressionCharacterView }
  | {
      type: LadderQueryType.PlayerProgressionCharacters;
      progressionCharacters: PlayerProgressionCharactersView;
    }
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
    case LadderQueryType.ExperiencePointsLadderRanks:
      return {
        type: request.type,
        ranksById: await ladderQueries.getExperiencePointsLadderRanks(request.query),
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
    case LadderQueryType.CumulativeClearRanks:
      return {
        type: request.type,
        ranksById: await ladderQueries.getCumulativeClearRanks(request.floorClearIds),
      };
    case LadderQueryType.FloorClear:
      return {
        type: request.type,
        floorClearOption: await ladderQueries.getFloorClear(request.floorClearId),
      };
    case LadderQueryType.GameRecord:
      return {
        type: request.type,
        gameRecordOption: await ladderQueries.getGameRecord(request.gameRecordId),
      };
    case LadderQueryType.ProgressionCharacter:
      return {
        type: request.type,
        characterOption: await ladderQueries.getProgressionCharacter(request.characterId),
      };
    case LadderQueryType.PlayerProgressionCharacters:
      return {
        type: request.type,
        progressionCharacters: await ladderQueries.getPlayerProgressionCharacters(request.query),
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
