import {
  LADDER_MAX_PAGE_SIZE,
  LADDER_MAX_RANKED_ENTRIES,
  LADDER_MAX_RANK_LOOKUP_IDS,
} from "../../app-consts.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { CharacterControlScheme, GameMode } from "../../game-modes/index.js";
import { PagedLadderQuery, pageSizeOf } from "./ladder-page.js";
import {
  CumulativeClearTimesQuery,
  FloorClearSort,
  FloorClearSortField,
  FloorClearTimesQuery,
} from "./floor-clear-times.js";
import {
  ExperiencePointsLadderQuery,
  ExperiencePointsLadderRankQuery,
} from "./experience-points-ladder.js";
import { WinRateLadderQuery } from "./win-rate-ladder.js";
import { UserGameHistoryQuery } from "./user-game-history.js";

// a ladder query reaches here from a client we do not control, and the url a frontend parses is only
// one of the ways in — anyone can open a socket and send the message themselves. typescript's types
// are gone by the time a query arrives, so a field is checked at runtime or it is not checked at all.
// an unknown control scheme used to read the sorted set "experience-points-ladder:undefined", which
// answers with an empty board: a broken query that looks exactly like an unpopulated one
export function validateExperiencePointsLadderQuery(query: ExperiencePointsLadderQuery): void {
  validatePagedQuery(query);
  validateControlScheme(query.controlScheme);
}

export function validateCumulativeClearTimesQuery(query: CumulativeClearTimesQuery): void {
  validatePagedQuery(query);
  validateControlScheme(query.controlScheme);
}

export function validateFloorClearTimesQuery(query: FloorClearTimesQuery): void {
  validatePagedQuery(query);
  // no ceiling on the floor: the deepest floor anyone has cleared is a fact about play, not a
  // constant, and a floor nobody reached is an empty board rather than a malformed request
  if (!Number.isInteger(query.floor) || query.floor < 1) {
    throw new Error(ERROR_MESSAGES.LADDER.INVALID_FLOOR);
  }
  if (query.controlSchemeOption !== undefined) {
    validateControlScheme(query.controlSchemeOption);
  }
  if (query.modeOption !== undefined) {
    validateGameMode(query.modeOption);
  }
  if (query.sortOption !== undefined) {
    validateFloorClearSort(query.sortOption);
  }
}

export function validateWinRateLadderQuery(query: WinRateLadderQuery): void {
  validatePagedQuery(query);
  if (!Number.isInteger(query.minimumGamesPlayed) || query.minimumGamesPlayed < 0) {
    throw new Error(ERROR_MESSAGES.LADDER.INVALID_MINIMUM_GAMES_PLAYED);
  }
  if (query.controlSchemeOption !== undefined) {
    validateControlScheme(query.controlSchemeOption);
  }
}

export function validateUserGameHistoryQuery(query: UserGameHistoryQuery): void {
  validatePagedQuery(query);
}

export function validateExperiencePointsLadderRankQuery(query: ExperiencePointsLadderRankQuery): void {
  validateControlScheme(query.controlScheme);
  validateRankLookupIds(query.characterIds);
}

// a rank lookup is one store round trip per id, so the length of the list is the caller naming how
// much work the server does — the same reason a page size is capped rather than merely well-formed
export function validateRankLookupIds(ids: unknown[]): void {
  if (!Array.isArray(ids) || ids.length > LADDER_MAX_RANK_LOOKUP_IDS) {
    throw new Error(ERROR_MESSAGES.LADDER.TOO_MANY_RANK_LOOKUP_IDS(LADDER_MAX_RANK_LOOKUP_IDS));
  }
}

// the query reaches here from a client we do not control. a negative page is not merely empty: it
// reaches zRange as an index counted from the end of the sorted set, and SQL OFFSET as an error. a
// page size is worse than either — it is the caller naming how many rows the server will read — so
// it is capped rather than merely well-formed
export function validatePagedQuery(query: PagedLadderQuery): void {
  if (!Number.isInteger(query.page) || query.page < 0) {
    throw new Error(ERROR_MESSAGES.LADDER.INVALID_PAGE);
  }
  const { pageSizeOption } = query;
  if (
    pageSizeOption !== undefined &&
    (!Number.isInteger(pageSizeOption) || pageSizeOption < 1 || pageSizeOption > LADDER_MAX_PAGE_SIZE)
  ) {
    throw new Error(ERROR_MESSAGES.LADDER.INVALID_PAGE_SIZE(LADDER_MAX_PAGE_SIZE));
  }
  // depth is refused rather than answered emptily, because the cost of OFFSET is paid on the way to
  // discovering there is nothing there. no pager can lead a reader this deep — totalPages is capped
  // to match — so a request this deep was hand-written
  if (query.page * pageSizeOf(query) >= LADDER_MAX_RANKED_ENTRIES) {
    throw new Error(ERROR_MESSAGES.LADDER.PAGE_BEYOND_RANKED_ENTRIES(LADDER_MAX_RANKED_ENTRIES));
  }
}

function validateControlScheme(controlScheme: CharacterControlScheme): void {
  if (!isNumericEnumMember(CharacterControlScheme, controlScheme)) {
    throw new Error(ERROR_MESSAGES.LADDER.INVALID_CONTROL_SCHEME);
  }
}

function validateGameMode(mode: GameMode): void {
  if (!isNumericEnumMember(GameMode, mode)) {
    throw new Error(ERROR_MESSAGES.LADDER.INVALID_GAME_MODE);
  }
}

function validateFloorClearSort(sort: FloorClearSort): void {
  if (!isNumericEnumMember(FloorClearSortField, sort.field)) {
    throw new Error(ERROR_MESSAGES.LADDER.INVALID_SORT_FIELD);
  }
  if (typeof sort.isDescending !== "boolean") {
    throw new Error(ERROR_MESSAGES.LADDER.INVALID_SORT_DIRECTION);
  }
}

// a numeric enum object holds its own reverse mapping, so a member is a key of it and a value that
// was never declared is not
function isNumericEnumMember(enumObject: Record<number, string>, value: number): boolean {
  return enumObject[value] !== undefined;
}
