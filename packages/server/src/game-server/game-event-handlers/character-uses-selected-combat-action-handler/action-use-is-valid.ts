import {
  Battle,
  CombatActionComponent,
  CombatActionTarget,
  CombatantContext,
  ERROR_MESSAGES,
  Inventory,
  getCombatActionPropertiesIfOwned,
  getUnmetCostResourceTypes,
} from "@speed-dungeon/common";

export function actionUseIsValid(
  action: CombatActionComponent,
  targets: CombatActionTarget,
  combatantContext: CombatantContext
): Error | void {
  const { game, party, combatant } = combatantContext;
  // HAS REQUIRED RESOURCES
  const consumableCost = action.costProperties.getConsumableCost();
  if (consumableCost !== null) {
    const { inventory } = combatant.combatantProperties;
    const consumableOption = Inventory.getConsumableByType(inventory, consumableCost);
    if (consumableOption === undefined) return new Error(ERROR_MESSAGES.ITEM.NOT_OWNED);
  }

  const { combatantProperties } = combatant;

  const costs = action.costProperties.getResourceCosts(combatantProperties);

  if (costs) {
    const unmetCosts = getUnmetCostResourceTypes(combatantProperties, costs);
    if (unmetCosts.length) return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.INSUFFICIENT_RESOURCES);
  }

  // ENSURE OWNERSHIP OF ABILITY
  const combatActionPropertiesResult = getCombatActionPropertiesIfOwned(
    combatant.combatantProperties,
    action.name
  );
  if (combatActionPropertiesResult instanceof Error) return combatActionPropertiesResult;

  // IF IN BATTLE, ONLY USE IF FIRST IN TURN ORDER
  let battleOption: null | Battle = null;
  if (party.battleId !== null) {
    const battle = game.battles[party.battleId];
    if (battle !== undefined) battleOption = battle;
    else return new Error(ERROR_MESSAGES.GAME.BATTLE_DOES_NOT_EXIST);
  }

  if (battleOption !== null) {
    const fastestActor = battleOption.turnOrderManager.getFastestActorTurnOrderTracker();
    if (fastestActor.combatantId !== combatant.entityProperties.id) {
      const message = `${ERROR_MESSAGES.COMBATANT.NOT_ACTIVE} first turn tracker ${JSON.stringify(fastestActor)}`;
      return new Error(message);
    }
  }

  const isInUsableContext = action.isUsableInThisContext(battleOption);
  if (!isInUsableContext) return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.INVALID_USABILITY_CONTEXT);

  const isWearingRequiredEquipment =
    action.combatantIsWearingRequiredEquipment(combatantProperties);
  if (!isWearingRequiredEquipment)
    return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NOT_WEARING_REQUIRED_EQUIPMENT);

  // @TODO - TARGETS ARE NOT IN A PROHIBITED STATE
  // this would only make sense if we didn't already check valid states when targeting... unless
  // target state could change while they are already targeted, like if someone healed themselves
  // to full hp while someone else was targeting them with an autoinjector
}
