import {
  CombatActionComponent,
  CombatActionTarget,
  CombatantContext,
  ERROR_MESSAGES,
  Inventory,
  getUnmetCostResourceTypes,
} from "@speed-dungeon/common";

export function actionUseIsValid(
  action: CombatActionComponent,
  targets: CombatActionTarget,
  combatantContext: CombatantContext
): Error | void {
  const { combatant } = combatantContext;
  // has required resources
  if (action.getConsumableCost) {
    const { inventory } = combatant.combatantProperties;
    const consumableOption = Inventory.getConsumableByType(inventory, action.getConsumableCost());
    if (consumableOption === undefined) return new Error(ERROR_MESSAGES.ITEM.NOT_OWNED);
  }

  const { combatantProperties } = combatant;

  const costs = action.costProperties.getResourceCosts(combatantProperties);

  if (costs) {
    const unmetCosts = getUnmetCostResourceTypes(combatantProperties, costs);
    if (unmetCosts.length) return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.INSUFFICIENT_RESOURCES);
  }

  // targets are not in a prohibited state
  // this would only make sense if we didn't already check valid states when targeting... unless
  // target state could change while they are already targeted, like if someone healed themselves
  // to full hp while someone else was targeting them with an autoinjector
}
