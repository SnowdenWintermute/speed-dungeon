import {
  ActionCommandPayload,
  ActionCommandType,
  ActionResult,
  CombatActionTargetType,
  combatActionRequiresMeleeRange,
} from "@speed-dungeon/common";

export default function composeActionCommandPayloadsFromActionResults(
  actionResults: ActionResult[]
) {
  if (!actionResults[0]) return [];

  console.log("ACTION RESULT: ");
  console.log(actionResults[0]);

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

    let hpChangesByEntityId: { [entityId: string]: { hpChange: number; isCrit: boolean } } = {};
    if (actionResult.hitPointChangesByEntityId)
      for (const [targetId, hpChange] of Object.entries(actionResult.hitPointChangesByEntityId)) {
        hpChangesByEntityId[targetId] = {
          hpChange,
          isCrit: actionResult.critsByEntityId?.includes(targetId) || false,
        };
      }

    payloads.push({
      type: ActionCommandType.PerformCombatAction,
      combatAction: actionResult.action,
      hpChangesByEntityId,
      mpChangesByEntityId: actionResult.manaChangesByEntityId,
      missesByEntityId: actionResult.missesByEntityId || [],
    });
  }

  payloads.push({ type: ActionCommandType.ReturnHome, shouldEndTurn });

  return payloads;
}

function createMoveIntoCombatActionPositionActionCommand(
  actionResult: ActionResult
): ActionCommandPayload {
  const isMelee = combatActionRequiresMeleeRange(actionResult.action);

  let primaryTargetId: string;
  if (actionResult.target.type === CombatActionTargetType.Single) {
    primaryTargetId = actionResult.target.targetId;
  } else {
    primaryTargetId = actionResult.targetIds[0] || actionResult.userId;
  }

  return { type: ActionCommandType.MoveIntoCombatActionPosition, isMelee, primaryTargetId };
}
