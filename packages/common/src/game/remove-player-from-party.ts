import { SpeedDungeonGame } from ".";
import cloneDeep from "lodash.clonedeep";
import { removeFromArray } from "../utils";

export default function removePlayerFromParty(this: SpeedDungeonGame, username: string) {
  const player = this.players[username];
  if (!player) throw new Error("No player found to remove");
  if (!player.partyName) return;

  const partyLeaving = this.adventuringParties[player.partyName];
  if (!partyLeaving) throw new Error("No party exists");
  const characterIds = cloneDeep(player.characterIds);
  player.characterIds = null;
  player.partyName = null;
  if (characterIds) {
    characterIds.forEach((characterId) => {
      partyLeaving.removeCharacter(characterId);
    });
  }

  removeFromArray(partyLeaving.playerUsernames, username);

  if (partyLeaving.playerUsernames.length < 1) delete this.adventuringParties[partyLeaving.name];
  return partyLeaving.name;
}
