import { ERROR_MESSAGES, SpeedDungeonGame } from "@speed-dungeon/common";

export default function getParty(game: null | SpeedDungeonGame, username: null | string) {
  if (!username)
    return new Error("Client has no username and therefore can't know what party they are in");
  if (!game) return new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
  const player = game.players[username];
  if (!player) return new Error(ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST);
  const partyName = player.partyName;
  if (!partyName) return new Error(ERROR_MESSAGES.PLAYER.MISSING_PARTY_NAME);
  const party = game.adventuringParties[partyName];
  if (!party) return new Error(ERROR_MESSAGES.GAME.PARTY_DOES_NOT_EXIST);

  return party;
}
