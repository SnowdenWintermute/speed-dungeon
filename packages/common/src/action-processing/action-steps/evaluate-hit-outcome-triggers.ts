import {
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepResult,
  ActionResolutionStepType,
} from "./index.js";
import { GameUpdateCommand, GameUpdateCommandType } from "../game-update-commands.js";
import { PostUseAnimationActionResolutionStep } from "./post-use-animation.js";
import { CombatActionName } from "../../combat/index.js";
import { EntityId } from "../../primatives/index.js";
import { AdventuringParty } from "../../adventuring-party/index.js";
import { AnimationName } from "../../app-consts.js";

const stepType = ActionResolutionStepType.evalOnHitOutcomeTriggers;
export class EvalOnHitOutcomeTriggersActionResolutionStep extends ActionResolutionStep {
  constructor(
    context: ActionResolutionStepContext,
    public hits: { combatantId: EntityId; actionName: CombatActionName }[]
    // get passed hits, misses, evades, parries, blocks (used for determining triggers as well as user followthrough animation)
  ) {
    const gameUpdateCommand: GameUpdateCommand = {
      type: GameUpdateCommandType.ActivatedTriggers,
      step: stepType,
      completionOrderId: null,
    };
    super(stepType, context, gameUpdateCommand);
  }

  protected onTick = () => {};
  getTimeToCompletion = () => 0;
  isComplete = () => true;

  protected onComplete(): Error | ActionResolutionStepResult {
    for (const { combatantId, actionName } of this.hits) {
      const combatantResult = AdventuringParty.getCombatant(
        this.context.combatantContext.party,
        combatantId
      );
      if (combatantResult instanceof Error) return combatantResult;
      for (const condition of combatantResult.combatantProperties.conditions) {
        if (!condition.triggeredWhenHitBy(actionName)) continue;
        // const triggeredActions = condition.onTriggered();
        // figure out the "user" for actions that originate from no combatant in particular
      }
    }

    return {
      // could return no next step conditionally
      branchingActions: [],
      nextStepOption: new PostUseAnimationActionResolutionStep(
        this.context,
        null,
        // "Sword strike rebound | Sword strike followthrough"
        AnimationName.Death
      ),
    };
  }
}
