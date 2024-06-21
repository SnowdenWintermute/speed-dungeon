import { SpeedDungeonGame } from "../../../game";
import { ActionResult } from "../action-result";
import applyActionResult from "./apply-action-result";

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
