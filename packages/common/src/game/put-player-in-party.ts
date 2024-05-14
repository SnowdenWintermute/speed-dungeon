import { SpeedDungeonGame } from ".";

export default function putPlayerInParty(
  this: SpeedDungeonGame,
  partyName: string,
  username: string
) {
  const party = this.adventuringParties[partyName];
  if (!party) throw new Error("Tried to put a player in a party but the party didn't exist");
  const player = this.players[username];
  if (!player)
    throw new Error("Tried to put a player in a party but couldn't find the player in this game");

  party.playerUsernames.push(username);
  player.partyName = partyName;
}
