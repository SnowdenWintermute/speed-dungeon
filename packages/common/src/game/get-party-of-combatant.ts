import { SpeedDungeonGame } from "./index.js";
import { AdventuringParty } from "../adventuring-party/index.js";
import { ERROR_MESSAGES } from "../errors/index.js";

export function getPartyOfCombatant(
  game: SpeedDungeonGame,
  combatantId: string
): Error | AdventuringParty {
  for (const party of Object.values(game.adventuringParties)) {
    const { combatantManager } = party;
    const combatantOption = combatantManager.getCombatantOption(combatantId);
    const combatantExistsInThisParty = combatantOption !== undefined;
    if (combatantExistsInThisParty) return party;
  }

  return new Error(ERROR_MESSAGES.COMBATANT.NOT_FOUND);
}
