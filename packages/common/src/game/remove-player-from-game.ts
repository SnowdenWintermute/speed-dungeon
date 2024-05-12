import { SpeedDungeonGame } from ".";

export default function removePlayer(this: SpeedDungeonGame, username: string) {
  this.removePlayerFromParty(username);
  this.players.delete(username);
  this.playersReadied.delete(username);
}
