import {
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "./index.js";
import { ActionPayableResource, COMBAT_ACTIONS } from "../../combat/index.js";
import { GameUpdateCommand, GameUpdateCommandType } from "../game-update-commands.js";
import { iterateNumericEnumKeyedRecord } from "../../utils/index.js";
import { CombatantProperties, Inventory } from "../../combatants/index.js";

const stepType = ActionResolutionStepType.PayResourceCosts;
export class PayResourceCostsActionResolutionStep extends ActionResolutionStep {
  constructor(context: ActionResolutionStepContext) {
    const { combatant } = context.combatantContext;
    const action = COMBAT_ACTIONS[context.tracker.actionExecutionIntent.actionName];
    const costsOption = action.costProperties.getResourceCosts(combatant.combatantProperties);
    const consumableTypeToConsumeOption = action.costProperties.getConsumableCost
      ? action.costProperties.getConsumableCost()
      : undefined;

    let gameUpdateCommandOption: null | GameUpdateCommand = null;
    if (costsOption !== null || consumableTypeToConsumeOption !== undefined) {
      gameUpdateCommandOption = {
        type: GameUpdateCommandType.ResourcesPaid,
        actionName: context.tracker.actionExecutionIntent.actionName,
        step: stepType,
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
        const { combatantProperties } = combatant;

        for (const [resource, cost] of iterateNumericEnumKeyedRecord(costsOption)) {
          switch (resource) {
            case ActionPayableResource.HitPoints:
              CombatantProperties.changeHitPoints(combatantProperties, cost);
              break;
            case ActionPayableResource.Mana:
              CombatantProperties.changeMana(combatantProperties, cost);
              break;
            case ActionPayableResource.Shards:
            case ActionPayableResource.QuickActions:
          }
        }
      }
    }

    super(stepType, context, gameUpdateCommandOption);
  }

  protected onTick = () => {};
  getTimeToCompletion = () => 0;
  getBranchingActions = () => [];
}
