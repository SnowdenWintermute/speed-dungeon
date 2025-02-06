import {
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepResult,
  ActionResolutionStepType,
} from "./index.js";
import { GameUpdateCommand, GameUpdateCommandType } from "../game-update-commands.js";
import { PostUseAnimationActionResolutionStep } from "./post-use-animation.js";
import { CombatActionExecutionIntent, CombatActionName, CombatActionTargetType } from "../../combat/index.js";

export class EvalOnHitOutcomeTriggersActionResolutionStep extends ActionResolutionStep {
  constructor(
    context: ActionResolutionStepContext
    // get passed hits, misses, evades, parries, blocks (used for determining triggers as well as user followthrough animation)
  ) {
    const gameUpdateCommand: GameUpdateCommand = {
      type: GameUpdateCommandType.ActivatedTriggers,
      completionOrderId: null,
    };
    super(ActionResolutionStepType.evalOnHitOutcomeTriggers, context, gameUpdateCommand);
  }

  protected onTick = () => {};
  getTimeToCompletion = () => 0;
  isComplete = () => true;

  protected onComplete(): ActionResolutionStepResult {

    // triggered explosion from condition:
    // get the combatant that had the condition
    // target that combatant and any combatant next to it
    const explosionIntent: CombatActionExecutionIntent = new CombatActionExecutionIntent(
      CombatActionName.Explosion,
      {
        type: CombatActionTargetType.SingleAndSides,
        targetId: "",
      }
    );


    return {
      branchingActions: [],
      nextStepOption: new PostUseAnimationActionResolutionStep(
        this.context,
        null,
        "Sword strike rebound | Sword strike followthrough"
      ),
    };
  }
}
