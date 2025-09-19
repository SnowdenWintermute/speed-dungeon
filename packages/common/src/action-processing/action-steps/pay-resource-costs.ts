import {
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "./index.js";
import { COMBAT_ACTION_NAME_STRINGS, COMBAT_ACTIONS } from "../../combat/index.js";
import { GameUpdateCommandType, ResourcesPaidGameUpdateCommand } from "../game-update-commands.js";
import { CombatantProperties, Inventory } from "../../combatants/index.js";
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

    const consumableTypeAndLevelToConsumeOption = action.costProperties.getConsumableCost
      ? action.costProperties.getConsumableCost(combatantProperties)
      : undefined;

    const cooldownOption = action.costProperties.getCooldownTurns(
      combatantProperties,
      selectedActionLevel
    );

    let gameUpdateCommandOption: null | ResourcesPaidGameUpdateCommand = null;

    if (
      costsOption !== null ||
      consumableTypeAndLevelToConsumeOption !== undefined ||
      cooldownOption
    ) {
      gameUpdateCommandOption = {
        type: GameUpdateCommandType.ResourcesPaid,
        step: stepType,
        actionName: action.name,
        completionOrderId: null,
        combatantId: combatant.entityProperties.id,
      };

      if (!!consumableTypeAndLevelToConsumeOption) {
        const { inventory } = combatant.combatantProperties;
        const consumableOption = Inventory.getConsumableByTypeAndLevel(
          inventory,
          consumableTypeAndLevelToConsumeOption.type,
          consumableTypeAndLevelToConsumeOption.level
        );
        if (consumableOption) {
          const removed = Inventory.removeConsumable(
            inventory,
            consumableOption.entityProperties.id
          );
          if (!(removed instanceof Error)) context.tracker.consumableUsed = removed;
          else console.error(removed);
          gameUpdateCommandOption.itemsConsumed = [consumableOption.entityProperties.id];
        }
      }

      if (costsOption) {
        gameUpdateCommandOption.costsPaid = costsOption;
        CombatantProperties.payResourceCosts(combatantProperties, costsOption);
      }

      const actionState = combatantProperties.abilityProperties.ownedActions[action.name];
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
