import cloneDeep from "lodash.clonedeep";
import { SpeedDungeonGame } from "./index.js";
import { removeFromArray } from "../utils/index.js";
import removeCharacterFromParty from "../adventuring_party/remove-character-from-party.js";

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
    Object.values(characterIds).forEach((characterId) => {
      removeCharacterFromParty(partyLeaving, characterId);
    });
  }

  removeFromArray(partyLeaving.playerUsernames, username);

  if (partyLeaving.playerUsernames.length < 1) {
    console.log("removing party", partyLeaving.name, "since no players remain");
    delete game.adventuringParties[partyLeaving.name];
  }
  return partyLeaving.name;
}
