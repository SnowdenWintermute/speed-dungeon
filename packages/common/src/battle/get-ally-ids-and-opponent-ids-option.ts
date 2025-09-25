import { Battle } from "./index.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { FriendOrFoe } from "../combat/index.js";
import { EntityId } from "../primatives/index.js";

// @REFACTOR move this on to the action users interface
export function getAllyIdsAndOpponentIdsOption(
  battle: Battle,
  combatantId: string
): Record<FriendOrFoe, EntityId[]> {
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

  return { [FriendOrFoe.Friendly]: allyIds, [FriendOrFoe.Hostile]: opponentIds };
}
