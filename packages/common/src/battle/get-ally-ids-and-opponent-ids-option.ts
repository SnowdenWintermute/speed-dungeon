import { Battle } from "./index.js";
import { ERROR_MESSAGES } from "../errors/index.js";

export interface CombatantIdsByDisposition {
  allyIds: string[];
  opponentIds: string[];
}

export function getAllyIdsAndOpponentIdsOption(
  battle: Battle,
  combatantId: string
): CombatantIdsByDisposition {
  const opponentIds = battle.groupA.combatantIds.includes(combatantId)
    ? battle.groupB.combatantIds
    : battle.groupB.combatantIds.includes(combatantId)
      ? battle.groupA.combatantIds
      : [];

  const allyIds = battle.groupA.combatantIds.includes(combatantId)
    ? battle.groupA.combatantIds
    : battle.groupB.combatantIds.includes(combatantId)
      ? battle.groupB.combatantIds
      : undefined;
  if (!allyIds) throw new Error(ERROR_MESSAGES.BATTLE.COMBATANT_NOT_IN_BATTLE);

  return { allyIds, opponentIds };
}
