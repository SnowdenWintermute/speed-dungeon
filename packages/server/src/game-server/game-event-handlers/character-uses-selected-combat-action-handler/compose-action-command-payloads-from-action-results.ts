import { ActionCommandPayload, ActionCommandType, ActionResult } from "@speed-dungeon/common";
import { createMoveIntoCombatActionPositionActionCommand } from "./create-move-into-combat-action-position-action-command.js";

export function composeActionCommandPayloadsFromActionResults(
  actionResults: ActionResult[]
): ActionCommandPayload[] {
  if (!actionResults[0]) return [];

  const payloads: ActionCommandPayload[] = [];
  const moveIntoPosition = createMoveIntoCombatActionPositionActionCommand(actionResults[0]);
  payloads.push(moveIntoPosition);

  let shouldEndTurn = false;

  for (const actionResult of actionResults) {
    if (actionResult.endsTurn) shouldEndTurn = true;

    payloads.push({
      type: ActionCommandType.PayAbilityCosts,
      mp: actionResult.manaCost,
      hp: 0,
      itemIds: actionResult.itemIdsConsumed,
    });

    payloads.push({
      type: ActionCommandType.PerformCombatAction,
      combatAction: actionResult.action,
      hpChangesByEntityId: actionResult.hitPointChangesByEntityId || {},
      mpChangesByEntityId: actionResult.manaChangesByEntityId,
      missesByEntityId: actionResult.missesByEntityId || [],
    });
  }

  payloads.push({ type: ActionCommandType.ReturnHome, shouldEndTurn });

  return payloads;
}
