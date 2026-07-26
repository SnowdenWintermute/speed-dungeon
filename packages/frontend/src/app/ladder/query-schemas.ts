import { z } from "zod";
import {
  CharacterControlScheme,
  ExperiencePointsLadderQuery,
  FLOOR_CLEAR_TIMES_DEFAULT_FLOOR,
  FloorClearTimesQuery,
  GameMode,
  LadderCharacterFloorClearRecordId,
  UserGameHistoryQuery,
  Username,
} from "@speed-dungeon/common";

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
  .object({ controlScheme: controlSchemeParam.optional(), page: pageParam.optional() })
  .transform(
    ({ controlScheme, page }): ExperiencePointsLadderQuery => ({
      controlScheme: controlScheme ?? CharacterControlScheme.Freelancer,
      page: page ?? 0,
    })
  );

export const floorClearTimesQuerySchema = z
  .object({
    floor: floorParam.optional(),
    page: pageParam.optional(),
    controlScheme: controlSchemeParam.optional(),
    mode: gameModeParam.optional(),
  })
  .transform(
    ({ floor, page, controlScheme, mode }): FloorClearTimesQuery => ({
      floor: floor ?? FLOOR_CLEAR_TIMES_DEFAULT_FLOOR,
      page: page ?? 0,
      controlSchemeOption: controlScheme,
      modeOption: mode,
    })
  );

export const userGameHistoryQuerySchema = z
  .object({ username: usernameParamSchema, page: pageParam.optional() })
  .transform(({ username, page }): UserGameHistoryQuery => ({ username, page: page ?? 0 }));
