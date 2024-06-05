import { SpeedDungeonGame } from ".";
import { removeFromArray } from "../utils/";
import removePlayerFromParty from "./remove-player-from-party";

export default function removePlayerFromGame(game: SpeedDungeonGame, username: string) {
  removePlayerFromParty(game, username);
  delete game.players[username];
  removeFromArray(game.playersReadied, username);
}
