import { SpeedDungeonGame } from "../../../game/index.js";
import { ActionResult } from "../action-result.js";
import applyActionResult from "./apply-action-result.js";

export default function applyActionResults(
  game: SpeedDungeonGame,
  actionResults: ActionResult[],
  battleIdOption: null | string
) {
  for (const actionResult of actionResults) {
    const maybeError = applyActionResult(game, actionResult, battleIdOption);
    if (maybeError instanceof Error) return maybeError;
  }
}
