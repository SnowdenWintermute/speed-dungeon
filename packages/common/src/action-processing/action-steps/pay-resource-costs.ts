import {
  ActionResolutionStep,
  ActionResolutionStepResult,
  ActionResolutionStepType,
} from "./index.js";
import { COMBAT_ACTIONS, CombatActionExecutionIntent } from "../../combat/index.js";
import { GameUpdateCommand, GameUpdateCommandType } from "../game-update-commands.js";
import { EvalOnUseTriggersActionResolutionStep } from "./evaluate-on-use-triggers.js";
import { CombatantContext } from "../../combatant-context/index.js";

export class PayResourceCostsActionResolutionStep extends ActionResolutionStep {
  constructor(
    private combatantContext: CombatantContext,
    private actionExecutionIntent: CombatActionExecutionIntent
  ) {
    // @TODO - calculate the actual costs paid
    // @TODO - apply the deducted costs to server game state combatant resources
    //
    const gameUpdateCommand: GameUpdateCommand = {
      type: GameUpdateCommandType.ResourcesPaid,
      completionOrderId: null,
      combatantId: combatantContext.combatant.entityProperties.id,
      costsPaid: {},
    };
    super(ActionResolutionStepType.payResourceCosts, gameUpdateCommand);
  }

  protected onTick = () => {};
  getTimeToCompletion = () => 0;
  isComplete = () => true;

  onComplete(): ActionResolutionStepResult {
    const action = COMBAT_ACTIONS[this.actionExecutionIntent.actionName];
    const costs = action.getResourceCosts(this.combatantContext.combatant.combatantProperties);

    return {
      branchingActions: [],
      nextStepOption: new EvalOnUseTriggersActionResolutionStep(
        this.combatantContext,
        this.actionExecutionIntent
      ),
    };
  }
}
