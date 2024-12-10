import { AdventuringParty } from "./index.js";
import { EntityId } from "../primatives/index.js";
import { removeFromArray } from "../utils/index.js";
import { SpeedDungeonPlayer } from "../game/player.js";
import { Combatant } from "../combatants/index.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { Battle } from "../battle/index.js";

export default function removeCharacterFromParty(
  party: AdventuringParty,
  characterId: EntityId,
  player: SpeedDungeonPlayer,
  battleOption: undefined | Battle
): Error | Combatant {
  if (battleOption) Battle.removeCombatantTurnTrackers(battleOption, characterId);

  removeFromArray(player.characterIds, characterId);
  const character = party.characters[characterId];
  delete party.characters[characterId];
  removeFromArray(party.characterPositions, characterId);

  if (character === undefined) return new Error(ERROR_MESSAGES.COMBATANT.NOT_FOUND);

  return character;
}
