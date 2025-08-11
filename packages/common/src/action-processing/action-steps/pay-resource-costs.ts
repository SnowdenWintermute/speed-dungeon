import {
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "./index.js";
import { COMBAT_ACTIONS, COMBAT_ACTION_NAME_STRINGS } from "../../combat/index.js";
import { GameUpdateCommandType, ResourcesPaidGameUpdateCommand } from "../game-update-commands.js";
import { CombatantProperties, Inventory } from "../../combatants/index.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { MaxAndCurrent } from "../../primatives/max-and-current.js";

const stepType = ActionResolutionStepType.PayResourceCosts;
export class PayResourceCostsActionResolutionStep extends ActionResolutionStep {
  constructor(context: ActionResolutionStepContext) {
    const { combatant } = context.combatantContext;
    const { combatantProperties } = combatant;

    let { selectedActionLevel } = combatantProperties;
    // for counterattacks, we'll not have a selected action level but we need one
    // to pass to the resource costst function
    if (selectedActionLevel === null) selectedActionLevel = 1;

    const action = COMBAT_ACTIONS[context.tracker.actionExecutionIntent.actionName];
    const inCombat = !!context.combatantContext.getBattleOption();

    const costsOption = action.costProperties.getResourceCosts(
      combatantProperties,
      inCombat,
      selectedActionLevel
    );

    const consumableTypeToConsumeOption = action.costProperties.getConsumableCost
      ? action.costProperties.getConsumableCost()
      : undefined;

    const cooldownOption = action.costProperties.getCooldownTurns(
      combatantProperties,
      selectedActionLevel
    );

    let gameUpdateCommandOption: null | ResourcesPaidGameUpdateCommand = null;

    if (costsOption !== null || consumableTypeToConsumeOption !== undefined || cooldownOption) {
      gameUpdateCommandOption = {
        type: GameUpdateCommandType.ResourcesPaid,
        step: stepType,
        actionName: action.name,
        completionOrderId: null,
        combatantId: combatant.entityProperties.id,
      };

      if (consumableTypeToConsumeOption !== null && consumableTypeToConsumeOption !== undefined) {
        const { inventory } = combatant.combatantProperties;
        const consumableOption = Inventory.getConsumableByType(
          inventory,
          consumableTypeToConsumeOption
        );
        if (consumableOption) {
          const removed = Inventory.removeConsumable(
            inventory,
            consumableOption.entityProperties.id
          );
          gameUpdateCommandOption.itemsConsumed = [consumableOption.entityProperties.id];
        }
      }

      if (costsOption) {
        gameUpdateCommandOption.costsPaid = costsOption;
        CombatantProperties.payResourceCosts(combatantProperties, costsOption);
      }

      const actionState = combatantProperties.ownedActions[action.name];
      if (actionState !== undefined) {
        actionState.wasUsedThisTurn = true;

        if (cooldownOption) {
          actionState.cooldown = new MaxAndCurrent(cooldownOption, cooldownOption);
          gameUpdateCommandOption.cooldownSet = cooldownOption;
        }
      }
    }

    super(stepType, context, gameUpdateCommandOption);
  }

  protected onTick = () => {};
  getTimeToCompletion = () => 0;
  getBranchingActions = () => [];
}
