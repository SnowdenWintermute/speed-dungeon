import {
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepResult,
  ActionResolutionStepType,
} from "./index.js";
import { ActionPayableResource, COMBAT_ACTIONS } from "../../combat/index.js";
import { GameUpdateCommand, GameUpdateCommandType } from "../game-update-commands.js";
import { EvalOnUseTriggersActionResolutionStep } from "./evaluate-on-use-triggers.js";
import { iterateNumericEnumKeyedRecord } from "../../utils/index.js";
import { CombatantProperties } from "../../combatants/index.js";

const stepType = ActionResolutionStepType.payResourceCosts;
export class PayResourceCostsActionResolutionStep extends ActionResolutionStep {
  constructor(context: ActionResolutionStepContext) {
    const action = COMBAT_ACTIONS[context.actionExecutionIntent.actionName];
    const costsOption = action.getResourceCosts(
      context.combatantContext.combatant.combatantProperties
    );

    let gameUpdateCommandOption: null | GameUpdateCommand = null;
    if (costsOption) {
      gameUpdateCommandOption = {
        type: GameUpdateCommandType.ResourcesPaid,
        step: stepType,
        completionOrderId: null,
        combatantId: context.combatantContext.combatant.entityProperties.id,
        costsPaid: costsOption,
      };

      const { combatantProperties } = context.combatantContext.combatant;

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

    super(stepType, context, gameUpdateCommandOption);
  }

  protected onTick = () => {};
  getTimeToCompletion = () => 0;
  isComplete = () => true;

  onComplete(): ActionResolutionStepResult {
    return {
      branchingActions: [],
      nextStepOption: new EvalOnUseTriggersActionResolutionStep(this.context),
    };
  }
}
