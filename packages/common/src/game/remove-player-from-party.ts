import cloneDeep from "lodash.clonedeep";
import { SpeedDungeonGame } from "./index.js";
import { Combatant } from "../combatants/index.js";
import { ArrayUtils } from "../utils/array-utils.js";

export type RemovedPlayerData = {
  partyNameLeft: null | string;
  partyWasRemoved: boolean;
  charactersRemoved: Combatant[];
};

// @REFACTOR - move method on to game class

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

  // if a removed character was taking their turn, end their turn
  const battleOption = SpeedDungeonGame.getBattleOption(game, partyLeaving.battleId);

  const characterIds = cloneDeep(player.characterIds);
  if (characterIds) {
    Object.values(characterIds).forEach((characterId) => {
      const removedCharacterResult = partyLeaving.removeCharacter(
        characterId,
        player,
        battleOption
      );
      if (removedCharacterResult instanceof Error) return removedCharacterResult;
      charactersRemoved.push(removedCharacterResult);
      delete game.lowestStartingFloorOptionsBySavedCharacter[characterId];
    });
  }

  battleOption?.turnOrderManager.updateTrackers(game, partyLeaving);

  player.partyName = null;

  ArrayUtils.removeElement(partyLeaving.playerUsernames, username);

  if (partyLeaving.playerUsernames.length < 1) {
    delete game.adventuringParties[partyLeaving.name];
    return { partyNameLeft: partyLeaving.name, partyWasRemoved: true, charactersRemoved };
  }

  return { partyNameLeft: partyLeaving.name, partyWasRemoved: false, charactersRemoved };
}
