import {
  ActionCommand,
  ActionCommandType,
  ActionResult,
  CombatActionTargetType,
  combatActionRequiresMeleeRange,
} from "@speed-dungeon/common";

export default function composeActionCommandsFromActionResults(actionResults: ActionResult[]) {
  if (!actionResults[0]) return;

  const actionCommands: ActionCommand[] = [];
  const moveIntoPosition = createMoveIntoCombatActionPositionActionCommand(actionResults[0]);
  actionCommands.push(moveIntoPosition);

  for (const actionResult of actionResults) {
    actionCommands.push({
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

    actionCommands.push({
      type: ActionCommandType.PerformCombatAction,
      combatAction: actionResult.action,
      hpChangesByEntityId,
      mpChangesByEntityId: null,
      missesByEntityId: actionResult.missesByEntityId || [],
    });
  }

  actionCommands.push({ type: ActionCommandType.ReturnHome });
}

function createMoveIntoCombatActionPositionActionCommand(
  actionResult: ActionResult
): ActionCommand {
  const isMelee = combatActionRequiresMeleeRange(actionResult.action);

  let primaryTargetId: string;
  if (actionResult.target.type === CombatActionTargetType.Single) {
    primaryTargetId = actionResult.target.targetId;
  } else {
    primaryTargetId = actionResult.targetIds[0] || actionResult.userId;
  }

  return { type: ActionCommandType.MoveIntoCombatActionPosition, isMelee, primaryTargetId };
}
