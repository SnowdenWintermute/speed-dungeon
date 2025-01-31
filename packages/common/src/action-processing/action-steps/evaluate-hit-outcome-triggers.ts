import {
  ActionResolutionStep,
  ActionResolutionStepResult,
  ActionResolutionStepType,
} from "./index.js";
import { CombatantAssociatedData } from "../../types.js";
import { CombatActionExecutionIntent } from "../../combat/index.js";
import { GameUpdateCommand } from "../game-update-commands.js";
import { PostUseAnimationActionResolutionStep } from "./post-use-animation.js";

export class EvalOnHitOutcomeTriggersActionResolutionStep extends ActionResolutionStep {
  constructor(
    private combatantContext: CombatantAssociatedData,
    private actionExecutionIntent: CombatActionExecutionIntent
    // hits, misses, evades, parries, blocks (used for determining triggers as well as user followthrough animation)
  ) {
    super(ActionResolutionStepType.evalOnHitOutcomeTriggers);
  }

  protected onTick = () => {};
  getTimeToCompletion = () => 0;
  isComplete = () => true;

  protected initialize(): GameUpdateCommand {
    // @TODO - collect all triggered actions and add to branchingActions list
    // @TODO - determine next step based on action type:
    throw new Error("Method not implemented.");
  }
  protected onComplete(): ActionResolutionStepResult {
    return {
      branchingActions: [],
      nextStepOption: new PostUseAnimationActionResolutionStep(
        this.combatantContext,
        null,
        "Sword strike rebound | Sword strike followthrough"
      ),
    };
  }
}
