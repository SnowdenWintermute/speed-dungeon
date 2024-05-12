import { SpeedDungeonGame } from ".";
import cloneDeep from "lodash.clonedeep";

export default function removePlayerFromParty(this: SpeedDungeonGame, username: string) {
  const player = this.players.get(username);
  if (!player) throw new Error("No player found to remove");
  if (!player.partyName) return;

  const partyLeaving = this.adventuringParties.get(player.partyName);
  if (!partyLeaving) throw new Error("No party exists");
  const characterIds = cloneDeep(player.characterIds);
  player.characterIds = null;
  player.partyName = null;
  if (characterIds) {
    characterIds.forEach((characterId) => {
      partyLeaving.removeCharacter(characterId);
    });
  }
  partyLeaving.playerUsernames.delete(username);

  if (partyLeaving.playerUsernames.size < 1) this.adventuringParties.delete(partyLeaving.name);
  return partyLeaving.name;
}
