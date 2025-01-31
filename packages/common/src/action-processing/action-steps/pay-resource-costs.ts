import {
  ActionResolutionStep,
  ActionResolutionStepResult,
  ActionResolutionStepType,
} from "./index.js";
import { CombatantAssociatedData } from "../../types.js";
import { COMBAT_ACTIONS, CombatActionExecutionIntent } from "../../combat/index.js";
import { GameUpdateCommand, GameUpdateCommandType } from "../game-update-commands.js";
import { EvalOnUseTriggersActionResolutionStep } from "./evaluate-on-use-triggers.js";

export class PayResourceCostsActionResolutionStep extends ActionResolutionStep {
  constructor(
    private combatantContext: CombatantAssociatedData,
    private actionExecutionIntent: CombatActionExecutionIntent
  ) {
    super(ActionResolutionStepType.payResourceCosts);
  }

  protected initialize(): GameUpdateCommand {
    // @TODO - calculate the actual costs paid
    // @TODO - apply the deducted costs to server game state combatant resources
    //
    return {
      type: GameUpdateCommandType.ResourcesPaid,
      completionOrderId: null,
      combatantId: this.combatantContext.combatant.entityProperties.id,
      costsPaid: {},
    };
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
