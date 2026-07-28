import {
  CumulativeClearTimesQuery,
  EntityId,
  ExperiencePointsLadderQuery,
  FloorClearTimesQuery,
  GameId,
  LadderPartyFloorClearRecordId,
  Username,
} from "@speed-dungeon/common";
import { buildUrlWithSearchParams } from "@/utils/build-url-with-search-params";
import { LADDER_URL_PARAMS } from "./url-params";

const LADDER_ROOT_PATHNAME = "/ladder";

// the board pathnames the tab bar points at and the route files live under. a board page's own
// filters travel as search params, so the pathname alone reaches it with its defaults
export const LADDER_PATHNAMES = {
  MAIN: LADDER_ROOT_PATHNAME,
  EXPERIENCE_POINTS: `${LADDER_ROOT_PATHNAME}/experience-points`,
  CUMULATIVE_CLEAR_TIMES: `${LADDER_ROOT_PATHNAME}/cumulative-clear-times`,
  FLOOR_CLEAR_TIMES: `${LADDER_ROOT_PATHNAME}/floor-clear-times`,
};

// one place builds every link into the ladder, since a row's cells are written per board.
// a board route takes the whole query rather than the field being changed: a pager and a selector
// both mean "this board, with one thing different", and the rest of the filters have to survive it.
// the character, floor clear and profile pages are still to be built
export function experiencePointsBoardRoute(query: ExperiencePointsLadderQuery): string {
  return buildUrlWithSearchParams(LADDER_PATHNAMES.EXPERIENCE_POINTS, {
    [LADDER_URL_PARAMS.CONTROL_SCHEME]: query.controlScheme,
    [LADDER_URL_PARAMS.PAGE]: query.page,
  });
}

export function cumulativeClearTimesBoardRoute(query: CumulativeClearTimesQuery): string {
  return buildUrlWithSearchParams(LADDER_PATHNAMES.CUMULATIVE_CLEAR_TIMES, {
    [LADDER_URL_PARAMS.CONTROL_SCHEME]: query.controlScheme,
    [LADDER_URL_PARAMS.PAGE]: query.page,
  });
}

export function floorClearTimesBoardRoute(query: FloorClearTimesQuery): string {
  return buildUrlWithSearchParams(LADDER_PATHNAMES.FLOOR_CLEAR_TIMES, {
    [LADDER_URL_PARAMS.FLOOR]: query.floor,
    [LADDER_URL_PARAMS.CONTROL_SCHEME]: query.controlSchemeOption,
    [LADDER_URL_PARAMS.MODE]: query.modeOption,
    [LADDER_URL_PARAMS.SORT_FIELD]: query.sortOption?.field,
    [LADDER_URL_PARAMS.SORT_IS_DESCENDING]: query.sortOption?.isDescending,
    [LADDER_URL_PARAMS.PAGE]: query.page,
  });
}

export function progressionCharacterRoute(characterId: EntityId): string {
  return `${LADDER_ROOT_PATHNAME}/character/${characterId}`;
}

export function floorClearRoute(floorClearId: LadderPartyFloorClearRecordId): string {
  return `${LADDER_ROOT_PATHNAME}/floor-clear/${floorClearId}`;
}

export function gameRecordRoute(gameRecordId: GameId): string {
  return `${LADDER_ROOT_PATHNAME}/game/${gameRecordId}`;
}

export function playerProfileRoute(username: Username): string {
  return `/profile/${encodeURIComponent(username)}`;
}
