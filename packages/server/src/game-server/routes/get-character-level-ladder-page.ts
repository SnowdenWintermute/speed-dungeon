import { NextFunction, Request, Response } from "express";
import { valkeyManager } from "../../kv-store";
import { CHARACTER_LEVEL_LADDER } from "../../kv-store/consts";
import CustomError from "../../express-error-handler/CustomError";
import { ERROR_MESSAGES, LADDER_PAGE_SIZE } from "@speed-dungeon/common";
import { playerCharactersRepo } from "../../database/repos/player-characters";

export default async function getCharacterLevelLadderPage(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.params.page) return next([new CustomError("No page number provided", 400)]);
  const pageNumberAsString = req.params.page;
  const pageNumber = parseInt(pageNumberAsString, 10);
  if (typeof pageNumber !== "number" || Number.isNaN(pageNumber))
    return next([new CustomError("Invalid page number", 501)]);

  const totalNumEntries = await valkeyManager.context.zCard(CHARACTER_LEVEL_LADDER);
  if (!totalNumEntries) return next([new CustomError(ERROR_MESSAGES.LADDER.NO_ENTRIES_FOUND, 404)]);
  const totalNumberOfPages = Math.ceil(totalNumEntries / LADDER_PAGE_SIZE);
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

  if (!inValkey) {
    console.log("no ladder entries in redis");
    return next([
      new CustomError(`${ERROR_MESSAGES.LADDER.NO_ENTRIES_FOUND} no ladder entries in redis`, 404),
    ]);
  }

  const ids = inValkey.map((item) => parseInt(item.value, 10));
  if (!ids.length) {
    console.log("redis entries didn't contain ids");
    return next([
      new CustomError(
        `${ERROR_MESSAGES.LADDER.NO_ENTRIES_FOUND}redis entries didn't contain ids`,
        404
      ),
    ]);
  }


  // fetch the characters from postgres
  // get the user names for the characters from snowauth server

  // const scoreCardsWithUsernames =
  //   await playerCharactersRepo.(ids);



  // if (!scoreCardsWithUsernames) {
  //   console.log("didn't find score cards in psql");
  //   return next([
  //     new CustomError(
  //       `${ERROR_MESSAGES.LADDER.NO_ENTRIES_FOUND}didn't find score cards in psql`,
  //       404
  //     ),
  //   ]);
  // }
  // const sortedByElo = scoreCardsWithUsernames.sort((a, b) => b.elo - a.elo);
  // const withRanks = sortedByElo.map((item, i) => {
  //   item.rank = i + start + 1;
  //   return item;
  // });

  // if (inRedis) return res.status(200).json({ totalNumberOfPages, pageData: withRanks });
  //
}
