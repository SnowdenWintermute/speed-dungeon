import { SpeedDungeonGame } from ".";
import { removeFromArray } from "../utils/";

export default function removePlayer(this: SpeedDungeonGame, username: string) {
  this.removePlayerFromParty(username);
  delete this.players[username];
  removeFromArray(this.playersReadied, username);
}
