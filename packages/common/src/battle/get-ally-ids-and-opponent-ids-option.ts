import { Battle } from ".";
import { ERROR_MESSAGES } from "../errors";

export interface AllyIdsAndOpponentIdsOption {
  allyIds: string[];
  opponentIdsOption: null | string[];
}

export default function getAllyIdsAndOpponentIdsOption(
  this: Battle,
  combatantId: string
): Error | AllyIdsAndOpponentIdsOption {
  const opponentIdsOption = this.groupA.combatantIds.includes(combatantId)
    ? this.groupB.combatantIds
    : this.groupB.combatantIds.includes(combatantId)
      ? this.groupA.combatantIds
      : null;

  const allyIds = this.groupA.combatantIds.includes(combatantId)
    ? this.groupA.combatantIds
    : this.groupB.combatantIds.includes(combatantId)
      ? this.groupB.combatantIds
      : undefined;
  if (!allyIds) return new Error(ERROR_MESSAGES.BATTLE.COMBATANT_NOT_IN_BATTLE);

  return { allyIds, opponentIdsOption };
}
