import {
  Battle,
  CombatActionComponent,
  CombatActionTarget,
  CombatantContext,
  CombatantProperties,
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
  const { combatantProperties } = combatant;

  const combatActionPropertiesResult = getCombatActionPropertiesIfOwned(
    combatant.combatantProperties,
    action.name
  );
  if (combatActionPropertiesResult instanceof Error) return combatActionPropertiesResult;

  const hasRequiredConsumables = CombatantProperties.hasRequiredConsumablesToUseAction(
    combatantProperties,
    action.name
  );
  if (!hasRequiredConsumables) return new Error(ERROR_MESSAGES.ITEM.NOT_OWNED);

  const hasRequiredResources = CombatantProperties.hasRequiredResourcesToUseAction(
    combatantProperties,
    action.name
  );

  if (!hasRequiredResources) return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.INSUFFICIENT_RESOURCES);

  const isWearingRequiredEquipment = CombatantProperties.isWearingRequiredEquipmentToUseAction(
    combatantProperties,
    action.name
  );
  if (!isWearingRequiredEquipment)
    return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NOT_WEARING_REQUIRED_EQUIPMENT);

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

  // @TODO - TARGETS ARE NOT IN A PROHIBITED STATE
  // this would only make sense if we didn't already check valid states when targeting... unless
  // target state could change while they are already targeted, like if someone healed themselves
  // to full hp while someone else was targeting them with an autoinjector
}
