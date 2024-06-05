import { SpeedDungeonGame } from ".";

export default function putPlayerInParty(
  game: SpeedDungeonGame,
  partyName: string,
  username: string
) {
  const party = game.adventuringParties[partyName];
  if (!party) throw new Error("Tried to put a player in a party but the party didn't exist");
  const player = game.players[username];
  if (!player)
    throw new Error("Tried to put a player in a party but couldn't find the player in game game");

  party.playerUsernames.push(username);
  player.partyName = partyName;
}
