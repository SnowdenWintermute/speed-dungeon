import { Battle } from "./index.js";
import { ERROR_MESSAGES } from "../errors/index.js";

export interface AllyIdsAndOpponentIdsOption {
  allyIds: string[];
  opponentIdsOption: null | string[];
}

export default function getAllyIdsAndOpponentIdsOption(
  battle: Battle,
  combatantId: string
): Error | AllyIdsAndOpponentIdsOption {
  const opponentIdsOption = battle.groupA.combatantIds.includes(combatantId)
    ? battle.groupB.combatantIds
    : battle.groupB.combatantIds.includes(combatantId)
      ? battle.groupA.combatantIds
      : null;

  const allyIds = battle.groupA.combatantIds.includes(combatantId)
    ? battle.groupA.combatantIds
    : battle.groupB.combatantIds.includes(combatantId)
      ? battle.groupB.combatantIds
      : undefined;
  if (!allyIds) return new Error(ERROR_MESSAGES.BATTLE.COMBATANT_NOT_IN_BATTLE);

  return { allyIds, opponentIdsOption };
}
