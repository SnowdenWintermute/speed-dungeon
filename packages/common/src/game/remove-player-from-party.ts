import cloneDeep from "lodash.clonedeep";
import { SpeedDungeonGame } from "./index.js";
import { removeFromArray } from "../utils/index.js";
import { AdventuringParty } from "../adventuring-party/index.js";

export default function removePlayerFromParty(game: SpeedDungeonGame, username: string) {
  const player = game.players[username];
  if (!player) throw new Error("No player found to remove");
  if (!player.partyName) return;

  const partyLeaving = game.adventuringParties[player.partyName];
  if (!partyLeaving) throw new Error("No party exists");

  const characterIds = cloneDeep(player.characterIds);
  if (characterIds) {
    Object.values(characterIds).forEach((characterId) => {
      AdventuringParty.removeCharacter(partyLeaving, characterId, player);
    });
  }

  player.partyName = null;

  removeFromArray(partyLeaving.playerUsernames, username);

  if (partyLeaving.playerUsernames.length < 1) {
    console.log("removing party", partyLeaving.name, "since no players remain");
    delete game.adventuringParties[partyLeaving.name];
  }
  return partyLeaving.name;
}
