import cloneDeep from "lodash.clonedeep";
import { SpeedDungeonGame } from "./index.js";
import { removeFromArray } from "../utils/index.js";
import { AdventuringParty } from "../adventuring-party/index.js";
import { Combatant } from "../combatants/index.js";

export type RemovedPlayerData = {
  partyNameLeft: null | string;
  partyWasRemoved: boolean;
  charactersRemoved: Combatant[];
};

/** returns the name of the party and if the party was removed from the game (in the case of its last member being removed) */
export default function removePlayerFromParty(
  game: SpeedDungeonGame,
  username: string
): Error | RemovedPlayerData {
  const player = game.players[username];
  const charactersRemoved: Combatant[] = [];
  if (!player) return new Error("No player found to remove");
  if (!player.partyName) return { partyNameLeft: null, partyWasRemoved: false, charactersRemoved };

  const partyLeaving = game.adventuringParties[player.partyName];
  if (!partyLeaving) return new Error("No party exists");

  const characterIds = cloneDeep(player.characterIds);
  if (characterIds) {
    Object.values(characterIds).forEach((characterId) => {
      const removedCharacterResult = AdventuringParty.removeCharacter(
        partyLeaving,
        characterId,
        player
      );
      if (removedCharacterResult instanceof Error) return removedCharacterResult;
      charactersRemoved.push(removedCharacterResult);
    });
  }

  player.partyName = null;

  removeFromArray(partyLeaving.playerUsernames, username);

  if (partyLeaving.playerUsernames.length < 1) {
    delete game.adventuringParties[partyLeaving.name];
    return { partyNameLeft: partyLeaving.name, partyWasRemoved: true, charactersRemoved };
  }

  return { partyNameLeft: partyLeaving.name, partyWasRemoved: false, charactersRemoved };
}
