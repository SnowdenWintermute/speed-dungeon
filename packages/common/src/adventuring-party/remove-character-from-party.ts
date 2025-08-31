import { AdventuringParty } from "./index.js";
import { EntityId } from "../primatives/index.js";
import { SpeedDungeonPlayer } from "../game/player.js";
import { Combatant } from "../combatants/index.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { Battle } from "../battle/index.js";
import { ArrayUtils } from "../utils/array-utils.js";

export function removeCharacterFromParty(
  party: AdventuringParty,
  characterId: EntityId,
  player: SpeedDungeonPlayer,
  battleOption: undefined | Battle
): Error | Combatant {
  if (battleOption) Battle.removeCombatant(battleOption, characterId);

  ArrayUtils.removeElement(player.characterIds, characterId);
  const character = party.characters[characterId];
  delete party.characters[characterId];

  ArrayUtils.removeElement(party.characterPositions, characterId);

  if (character === undefined) return new Error(ERROR_MESSAGES.COMBATANT.NOT_FOUND);

  return character;
}
