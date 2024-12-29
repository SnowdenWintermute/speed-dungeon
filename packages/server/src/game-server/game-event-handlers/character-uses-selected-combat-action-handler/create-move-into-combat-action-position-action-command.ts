import {
  ActionCommandPayload,
  ActionCommandType,
  ActionResult,
  CombatActionTargetType,
  combatActionRequiresMeleeRange,
} from "@speed-dungeon/common";

export function createMoveIntoCombatActionPositionActionCommand(
  actionResult: ActionResult
): ActionCommandPayload {
  const isMelee = combatActionRequiresMeleeRange(actionResult.action);

  let primaryTargetId: string;
  if (actionResult.target.type === CombatActionTargetType.Single) {
    primaryTargetId = actionResult.target.targetId;
  } else {
    primaryTargetId = actionResult.targetIds[0] || actionResult.userId;
  }

  return {
    type: ActionCommandType.MoveIntoCombatActionPosition,
    actionUserId: actionResult.userId,
    isMelee,
    primaryTargetId,
  };
}
