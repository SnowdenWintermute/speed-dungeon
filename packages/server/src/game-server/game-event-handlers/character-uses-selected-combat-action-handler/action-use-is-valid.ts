import { CombatActionComponent, CombatActionTarget, CombatantContext } from "@speed-dungeon/common";

export function actionUseIsValid(
  action: CombatActionComponent,
  targets: CombatActionTarget,
  combatantContext: CombatantContext
): Error | void {
  // has required resources
  // targets are not in a prohibited state
}
