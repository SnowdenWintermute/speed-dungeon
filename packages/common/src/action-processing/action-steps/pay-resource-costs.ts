import {
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "./index.js";
import { COMBAT_ACTION_NAME_STRINGS, COMBAT_ACTIONS } from "../../combat/index.js";
import { GameUpdateCommandType, ResourcesPaidGameUpdateCommand } from "../game-update-commands.js";
import { CombatantProperties, Inventory } from "../../combatants/index.js";
import { ERROR_MESSAGES } from "../../errors/index.js";

const stepType = ActionResolutionStepType.PayResourceCosts;
export class PayResourceCostsActionResolutionStep extends ActionResolutionStep {
  constructor(context: ActionResolutionStepContext) {
    const { combatant } = context.combatantContext;
    const action = COMBAT_ACTIONS[context.tracker.actionExecutionIntent.actionName];

    const inCombat = !!context.combatantContext.getBattleOption();

    const { combatantProperties } = combatant;
    let { selectedActionLevel } = combatantProperties;

    // for counterattacks, we'll not have a selected action level but we need one
    // to pass to the resource costst function
    if (selectedActionLevel === null) selectedActionLevel = 1;

    const costsOption = action.costProperties.getResourceCosts(
      combatantProperties,
      inCombat,
      selectedActionLevel
    );

    const consumableTypeToConsumeOption = action.costProperties.getConsumableCost
      ? action.costProperties.getConsumableCost()
      : undefined;

    let gameUpdateCommandOption: null | ResourcesPaidGameUpdateCommand = null;

    if (costsOption !== null || consumableTypeToConsumeOption !== undefined) {
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

        CombatantProperties.payResourceCosts(combatantProperties, costsOption, selectedActionLevel);
      }
    }

    console.log(
      "after payResourceCosts for action",
      COMBAT_ACTION_NAME_STRINGS[action.name],
      combatant.combatantProperties.actionPoints
    );

    super(stepType, context, gameUpdateCommandOption);
  }

  protected onTick = () => {};
  getTimeToCompletion = () => 0;
  getBranchingActions = () => [];
}
