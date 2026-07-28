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
  GameId,
  GameMode,
  LadderCharacterFloorClearRecordId,
  LadderPartyFloorClearRecordId,
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

// the branded aliases have no runtime constructor, so the cast is confined to these schemas
export const usernameParamSchema = z
  .string()
  .min(1)
  .transform((value) => value as Username);

// every ladder record id is a uuid: the columns are UUID, and every server this talks to — lobby,
// game node, and the in-process offline one — issues ids from IdGeneratorRandom. checking the shape
// is what makes "the query answered undefined" mean the record is gone rather than that the url was
// mistyped, and it keeps a malformed id from reaching a UUID column, where postgres raises a syntax
// error instead of returning no rows
const recordIdParam = z.string().uuid();

export const floorClearSnapshotIdParamSchema = recordIdParam.transform(
  (value) => value as LadderCharacterFloorClearRecordId
);

export const floorClearIdParamSchema = recordIdParam.transform(
  (value) => value as LadderPartyFloorClearRecordId
);

export const gameRecordIdParamSchema = recordIdParam.transform((value) => value as GameId);

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

// what a reader is looking at on a profile: which facet of their personal bests, and where their game
// history is paged to. the username is a path segment, parsed on its own.
// the mode and scheme default to the same facet the floor clear board opens on, so the two agree
// about what "no filter stated" means
export interface ProfileUrlState {
  page: number;
  mode: GameMode;
  controlScheme: CharacterControlScheme;
}

export const profileUrlStateSchema = z
  .object({
    [LADDER_URL_PARAMS.PAGE]: pageParam.optional(),
    [LADDER_URL_PARAMS.MODE]: gameModeParam.optional(),
    [LADDER_URL_PARAMS.CONTROL_SCHEME]: controlSchemeParam.optional(),
  })
  .transform(
    ({ page, mode, controlScheme }): ProfileUrlState => ({
      page: page ?? 0,
      mode: mode ?? GameMode.Ironman,
      controlScheme: controlScheme ?? CharacterControlScheme.Freelancer,
    })
  );
