import { SpeedDungeonGame } from ".";

export default function putPlayerInParty(
  this: SpeedDungeonGame,
  partyName: string,
  username: string
) {
  const party = this.adventuringParties.get(partyName);
  if (!party) throw new Error("Tried to put a player in a party but the party didn't exist");
  const player = this.players.get(username);
  if (!player)
    throw new Error("Tried to put a player in a party but couldn't find the player in this game");

  party.playerUsernames.add(username);
  player.partyName = partyName;
}
