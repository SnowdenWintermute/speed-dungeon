import { SpeedDungeonGame } from ".";
import cloneDeep from "lodash.clonedeep";
import { removeFromArray } from "../utils";
import removeCharacterFromParty from "../adventuring_party/remove-character-from-party";

export default function removePlayerFromParty(game: SpeedDungeonGame, username: string) {
  const player = game.players[username];
  if (!player) throw new Error("No player found to remove");
  if (!player.partyName) return;

  const partyLeaving = game.adventuringParties[player.partyName];
  if (!partyLeaving) throw new Error("No party exists");
  const characterIds = cloneDeep(player.characterIds);
  player.characterIds = [];
  player.partyName = null;
  if (characterIds) {
    Object.keys(characterIds).forEach((characterId) => {
      removeCharacterFromParty(partyLeaving, characterId);
    });
  }

  removeFromArray(partyLeaving.playerUsernames, username);

  if (partyLeaving.playerUsernames.length < 1) delete game.adventuringParties[partyLeaving.name];
  return partyLeaving.name;
}
