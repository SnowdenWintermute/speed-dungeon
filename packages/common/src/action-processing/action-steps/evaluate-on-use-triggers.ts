import {
  ActionResolutionStep,
  ActionResolutionStepResult,
  ActionResolutionStepType,
} from "./index.js";
import { CombatantAssociatedData } from "../../types.js";
import { CombatActionExecutionIntent } from "../../combat/index.js";
import { GameUpdateCommand } from "../game-update-commands.js";
import { RollIncomingHitOutcomesActionResolutionStep } from "./roll-incoming-hit-outcomes.js";

export class EvalOnUseTriggersActionResolutionStep extends ActionResolutionStep {
  constructor(
    private combatantContext: CombatantAssociatedData,
    private actionExecutionIntent: CombatActionExecutionIntent
  ) {
    super(ActionResolutionStepType.evalOnUseTriggers);
  }

  protected initialize(): GameUpdateCommand {
    // counterspells
    throw new Error("Method not implemented.");
  }
  protected onTick = () => {};
  getTimeToCompletion = () => 0;
  isComplete = () => true;

  onComplete(): ActionResolutionStepResult {
    // @TODO - set any sub actions to the branchingActions list
    // @TODO - collect all triggered actions and add to branchingActions list
    // @TODO - determine next step based on action type:
    // ex: if countered, skip the rollIncomingHitOutcomes step and go to postUseAnimation with a countered animation
    // and push a GameUpdateCommand with the counter animation for the countering combatant
    return {
      branchingActions: [], // split arrow, split arrow, split arrow
      // in case of subActions, skip to post use animation
      nextStepOption: new RollIncomingHitOutcomesActionResolutionStep(
        this.combatantContext,
        this.actionExecutionIntent
      ),
    };
  }
}
