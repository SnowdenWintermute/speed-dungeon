import { NextFunction, Request, Response } from "express";
import CustomError from "../../express-error-handler/CustomError.js";
import { speedDungeonProfilesRepo } from "../../database/repos/speed-dungeon-profiles.js";
import { ERROR_MESSAGES, ProfileCharacterRanks, SanitizedProfile } from "@speed-dungeon/common";
import { valkeyManager } from "../../kv-store/index.js";
import { CHARACTER_LEVEL_LADDER } from "../../kv-store/consts.js";
import { fetchSavedCharacters } from "../saved-character-event-handlers/fetch-saved-characters.js";

export default async function getUserProfileHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId: number = res.locals.userId; // expected from middleware
    const profile = await speedDungeonProfilesRepo.findOne("ownerId", userId);

    if (!profile) return next([new CustomError(ERROR_MESSAGES.USER.MISSING_PROFILE, 404)]);

    const sanitized = new SanitizedProfile(profile);

    const characterSlotsResult = await fetchSavedCharacters(profile.id);
    if (characterSlotsResult instanceof Error) {
      return next(new CustomError(characterSlotsResult.message, 500));
    }

    let characterRanks: ProfileCharacterRanks = {};
    for (const character of Object.values(characterSlotsResult)) {
      const rank = await valkeyManager.context.zRevRank(
        CHARACTER_LEVEL_LADDER,
        character.combatant.entityProperties.id
      );
      const { combatantProperties, entityProperties } = character.combatant;
      characterRanks[entityProperties.id] = {
        name: entityProperties.name,
        rank,
        level: combatantProperties.level,
        class: combatantProperties.combatantClass,
      };
    }

    res.json({ profile: sanitized, characterRanks });
  } catch (error) {
    console.error(error);
    return next([new CustomError("Something went wrong", 500)]);
  }
}
