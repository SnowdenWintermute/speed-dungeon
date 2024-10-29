import cloneDeep from "lodash.clonedeep";
import { SpeedDungeonGame } from "./index.js";
import { removeFromArray } from "../utils/index.js";
import { AdventuringParty } from "../adventuring-party/index.js";

/** returns the name of the party and if the party was removed from the game (in the case of its last member being removed) */
export default function removePlayerFromParty(game: SpeedDungeonGame, username: string) {
  const player = game.players[username];
  if (!player) return new Error("No player found to remove");
  if (!player.partyName) return { partyNameLeft: null, partyWasRemoved: false };

  const partyLeaving = game.adventuringParties[player.partyName];
  if (!partyLeaving) return new Error("No party exists");

  const characterIds = cloneDeep(player.characterIds);
  if (characterIds) {
    Object.values(characterIds).forEach((characterId) => {
      AdventuringParty.removeCharacter(partyLeaving, characterId, player);
    });
  }

  player.partyName = null;

  removeFromArray(partyLeaving.playerUsernames, username);

  if (partyLeaving.playerUsernames.length < 1) {
    delete game.adventuringParties[partyLeaving.name];
    return { partyNameLeft: partyLeaving.name, partyWasRemoved: true };
  }

  return { partyNameLeft: partyLeaving.name, partyWasRemoved: false };
}
