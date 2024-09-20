import { SpeedDungeonGame } from "./index.js";
import { removeFromArray } from "../utils//index.js";
import removePlayerFromParty from "./remove-player-from-party.js";

export default function removePlayerFromGame(game: SpeedDungeonGame, username: string) {
  removePlayerFromParty(game, username);
  delete game.players[username];
  removeFromArray(game.playersReadied, username);
}
