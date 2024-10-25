import { NextFunction, Request, Response } from "express";
import { valkeyManager } from "../../kv-store/index.js";
import { CHARACTER_LEVEL_LADDER } from "../../kv-store/consts.js";
import CustomError from "../../express-error-handler/CustomError.js";
import { ERROR_MESSAGES, LADDER_PAGE_SIZE, LevelLadderEntry } from "@speed-dungeon/common";
import { env } from "../../validate-env.js";
import { PlayerCharacter, playerCharactersRepo } from "../../database/repos/player-characters.js";

export default async function getCharacterLevelLadderPageHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.log("hit level ladder route");
  try {
    if (!req.params.page) return next([new CustomError("No page number provided", 400)]);
    const pageNumberAsString = req.params.page;
    const pageNumber = parseInt(pageNumberAsString, 10) - 1;
    if (typeof pageNumber !== "number" || Number.isNaN(pageNumber))
      return next([new CustomError("Invalid page number", 501)]);

    const totalNumEntries = await valkeyManager.context.zCard(CHARACTER_LEVEL_LADDER);
    if (!totalNumEntries)
      return next([new CustomError(ERROR_MESSAGES.LADDER.NO_ENTRIES_FOUND, 404)]);
    console.log("totalNumEntries: ", totalNumEntries);
    console.log("LADDER_PAGE_SIZE: ", LADDER_PAGE_SIZE);
    const totalNumberOfPages = Math.ceil(totalNumEntries / LADDER_PAGE_SIZE);
    console.log("totalNumberOfPages: ", totalNumberOfPages);
    const start = pageNumber * LADDER_PAGE_SIZE;
    const end = LADDER_PAGE_SIZE + LADDER_PAGE_SIZE * pageNumber;

    const inValkey = await valkeyManager.context.zRangeWithScores(
      CHARACTER_LEVEL_LADDER,
      start,
      end - 1,
      {
        REV: true,
      }
    );

    const ranksByCharacterId: { [characterId: string]: number } = {};
    inValkey.forEach((item, i) => {
      ranksByCharacterId[item.value] = i + pageNumber + 1;
    });

    if (!inValkey) {
      console.log("no ladder entries in valkey");
      return next([new CustomError(`${ERROR_MESSAGES.LADDER.NO_ENTRIES_FOUND}`, 404)]);
    }

    const characterIds = inValkey.map((item) => item.value);
    if (!characterIds.length) {
      console.log("redis entries didn't contain ids");
      return next([new CustomError(`${ERROR_MESSAGES.LADDER.NO_ENTRIES_FOUND} on this page`, 404)]);
    }

    const characterFetchPromises: Promise<void>[] = [];
    const charactersById: { [characterId: string]: PlayerCharacter } = {};

    for (const id of characterIds) {
      characterFetchPromises.push(
        new Promise(async (resolve, reject) => {
          const character = await playerCharactersRepo.findById(id);
          if (!character) {
            console.error("Character in ladder not found in database");
            return reject();
          }
          charactersById[id] = character;
          resolve();
        })
      );
    }

    await Promise.all(characterFetchPromises);

    const characterOwnerIds = Object.values(charactersById).map((character) => character.ownerId);

    const cookies = `internal=${env.INTERNAL_SERVICES_SECRET};`;
    const idsQueryString = `?ids=${characterOwnerIds.join(",")}`;

    const usernamesResponse = await fetch(
      `${env.AUTH_SERVER_URL}/internal/usernames${idsQueryString}`,
      {
        method: "GET",
        headers: {
          Cookie: cookies,
        },
      }
    );

    const usernamesByOwnerId = await usernamesResponse.json();
    const toReturn: LevelLadderEntry[] = [];

    for (const character of Object.values(charactersById)) {
      const rank = ranksByCharacterId[character.id];
      if (rank === undefined) {
        console.error("Expected rank not found");
        continue;
      }
      toReturn.push({
        owner: usernamesByOwnerId[character.ownerId] || "",
        characterName: character.name,
        characterId: character.id,
        level: character.combatantProperties.level,
        rank,
        gameVersion: character.gameVersion,
      });
    }

    console.log("sending data: ", toReturn);

    res.json({ entriesOnPage: toReturn, totalNumberOfPages });
  } catch (error) {
    return next([new CustomError("Something went wrong", 500)]);
  }
}
