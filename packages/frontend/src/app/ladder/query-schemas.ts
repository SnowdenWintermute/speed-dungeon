import { z } from "zod";
import {
  CharacterControlScheme,
  CumulativeClearTimesQuery,
  DEFAULT_FLOOR_CLEAR_SORT,
  ExperiencePointsLadderQuery,
  FLOOR_CLEAR_TIMES_DEFAULT_FLOOR,
  FloorClearSort,
  FloorClearSortField,
  FloorClearTimesQuery,
  GameMode,
  LadderCharacterFloorClearRecordId,
  UserGameHistoryQuery,
  Username,
} from "@speed-dungeon/common";
import { LADDER_URL_PARAMS } from "./url-params";

// url text is untrusted input like any other. the schemas own the defaults for absent params and
// reject present-but-invalid ones, so a typo shows as an error instead of silently reading page 0
const pageParam = z.string().min(1).pipe(z.coerce.number().int().nonnegative());
const floorParam = z.string().min(1).pipe(z.coerce.number().int().positive());

const controlSchemeParam = z
  .string()
  .min(1)
  .pipe(z.coerce.number())
  .pipe(z.nativeEnum(CharacterControlScheme));

const gameModeParam = z.string().min(1).pipe(z.coerce.number()).pipe(z.nativeEnum(GameMode));

const sortFieldParam = z
  .string()
  .min(1)
  .pipe(z.coerce.number())
  .pipe(z.nativeEnum(FloorClearSortField));

// z.coerce.boolean() is javascript truthiness, under which the string "false" is true
const booleanParam = z.enum(["true", "false"]).transform((value) => value === "true");

// the branded aliases have no runtime constructor, so the cast is confined to these two schemas
export const usernameParamSchema = z
  .string()
  .min(1)
  .transform((value) => value as Username);

export const floorClearSnapshotIdParamSchema = z
  .string()
  .min(1)
  .transform((value) => value as LadderCharacterFloorClearRecordId);

export const experiencePointsLadderQuerySchema = z
  .object({
    [LADDER_URL_PARAMS.CONTROL_SCHEME]: controlSchemeParam.optional(),
    [LADDER_URL_PARAMS.PAGE]: pageParam.optional(),
  })
  .transform(
    ({ controlScheme, page }): ExperiencePointsLadderQuery => ({
      controlScheme: controlScheme ?? CharacterControlScheme.Freelancer,
      page: page ?? 0,
    })
  );

export const cumulativeClearTimesQuerySchema = z
  .object({
    [LADDER_URL_PARAMS.CONTROL_SCHEME]: controlSchemeParam.optional(),
    [LADDER_URL_PARAMS.PAGE]: pageParam.optional(),
  })
  .transform(
    ({ controlScheme, page }): CumulativeClearTimesQuery => ({
      controlScheme: controlScheme ?? CharacterControlScheme.Freelancer,
      page: page ?? 0,
    })
  );

// scheme, mode and sort are optional on the query itself, since other callers may not care. this
// board always states all three — its facets are one floor of one mode under one scheme, and a
// header can only show which column is sorted if the page knows the sort rather than leaving it to
// the server's default. narrowing them here is what lets the board read them without a fallback
export interface FloorClearTimesBoardQuery extends FloorClearTimesQuery {
  controlSchemeOption: CharacterControlScheme;
  modeOption: GameMode;
  sortOption: FloorClearSort;
}

export const floorClearTimesQuerySchema = z
  .object({
    [LADDER_URL_PARAMS.FLOOR]: floorParam.optional(),
    [LADDER_URL_PARAMS.PAGE]: pageParam.optional(),
    [LADDER_URL_PARAMS.CONTROL_SCHEME]: controlSchemeParam.optional(),
    [LADDER_URL_PARAMS.MODE]: gameModeParam.optional(),
    [LADDER_URL_PARAMS.SORT_FIELD]: sortFieldParam.optional(),
    [LADDER_URL_PARAMS.SORT_IS_DESCENDING]: booleanParam.optional(),
  })
  .transform(
    ({
      floor,
      page,
      controlScheme,
      mode,
      sortField,
      sortIsDescending,
    }): FloorClearTimesBoardQuery => ({
      floor: floor ?? FLOOR_CLEAR_TIMES_DEFAULT_FLOOR,
      page: page ?? 0,
      controlSchemeOption: controlScheme ?? CharacterControlScheme.Freelancer,
      modeOption: mode ?? GameMode.Ironman,
      sortOption: {
        field: sortField ?? DEFAULT_FLOOR_CLEAR_SORT.field,
        isDescending: sortIsDescending ?? DEFAULT_FLOOR_CLEAR_SORT.isDescending,
      },
    })
  );

export const userGameHistoryQuerySchema = z
  .object({ username: usernameParamSchema, [LADDER_URL_PARAMS.PAGE]: pageParam.optional() })
  .transform(({ username, page }): UserGameHistoryQuery => ({ username, page: page ?? 0 }));
