import { ArrayUtils } from "../utils/array-utils.js";
import { SpeedDungeonGame } from "./index.js";
import removePlayerFromParty from "./remove-player-from-party.js";

export function removePlayerFromGame(game: SpeedDungeonGame, username: string) {
  const removedPlayerResult = removePlayerFromParty(game, username);
  if (removedPlayerResult instanceof Error) return removedPlayerResult;
  delete game.players[username];
  ArrayUtils.removeElement(game.playersReadied, username);
  return removedPlayerResult;
}
