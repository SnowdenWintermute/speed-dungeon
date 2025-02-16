import {
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "./index.js";
import { GameUpdateCommand, GameUpdateCommandType } from "../game-update-commands.js";
import { CombatActionExecutionIntent } from "../../combat/index.js";
import { Combatant } from "../../combatants/index.js";

const stepType = ActionResolutionStepType.EvalOnHitOutcomeTriggers;
export class EvalOnHitOutcomeTriggersActionResolutionStep extends ActionResolutionStep {
  branchingActions: { user: Combatant; actionExecutionIntent: CombatActionExecutionIntent }[] = [];
  constructor(context: ActionResolutionStepContext) {
    const gameUpdateCommand: GameUpdateCommand = {
      type: GameUpdateCommandType.ActivatedTriggers,
      step: stepType,
      completionOrderId: null,
    };
    super(stepType, context, gameUpdateCommand);
    // read expected hits, misses, evades, parries, blocks (used for determining triggers as well as user followthrough animation)
    // from billboard
    //
    // for (const { combatantId, actionName } of this.hits) {
    //   const combatantResult = AdventuringParty.getCombatant(
    //     this.context.combatantContext.party,
    //     combatantId
    //   );
    //   if (combatantResult instanceof Error) throw combatantResult;
    //   for (const condition of combatantResult.combatantProperties.conditions) {
    //     if (!condition.triggeredWhenHitBy(actionName)) continue;
    //     // const triggeredActions = condition.onTriggered();
    //     // figure out the "user" for actions that originate from no combatant in particular
    //   }
    // }
  }

  protected onTick = () => {};
  getTimeToCompletion = () => 0;
  isComplete = () => true;

  getBranchingActions():
    | Error
    | { user: Combatant; actionExecutionIntent: CombatActionExecutionIntent }[] {
    //
    return this.branchingActions;
  }
}
