import {
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "./index.js";
import { COMBAT_ACTIONS, CombatActionExecutionIntent } from "../../combat/index.js";
import { GameUpdateCommand, GameUpdateCommandType } from "../game-update-commands.js";
import { Combatant } from "../../combatants/index.js";
import { updateConditionalDurabilityChangesOnUser } from "../../combat/action-results/calculate-action-durability-changes.js";
import { DurabilityLossCondition } from "../../combat/combat-actions/combat-action-durability-loss-condition.js";
import { DurabilityChangesByEntityId } from "../../durability/index.js";

const stepType = ActionResolutionStepType.EvalOnUseTriggers;
export class EvalOnUseTriggersActionResolutionStep extends ActionResolutionStep {
  constructor(context: ActionResolutionStepContext) {
    const gameUpdateCommand: GameUpdateCommand = {
      type: GameUpdateCommandType.ActivatedTriggers,
      step: stepType,
      completionOrderId: null,
    };

    super(stepType, context, gameUpdateCommand);
    // @TODO - counterspells
    // if countered, set the tracker "wasInterrupted" to true

    const { tracker, combatantContext } = context;
    const { game, combatant } = combatantContext;

    const action = COMBAT_ACTIONS[tracker.actionExecutionIntent.actionName];

    const durabilityChanges = new DurabilityChangesByEntityId();
    updateConditionalDurabilityChangesOnUser(
      combatant.entityProperties.id,
      action,
      durabilityChanges,
      DurabilityLossCondition.OnUse
    );

    if (!durabilityChanges.isEmpty()) {
      gameUpdateCommand.durabilityChanges = durabilityChanges;
      DurabilityChangesByEntityId.ApplyToGame(game, durabilityChanges);
    }
  }

  protected onTick = () => {};
  getTimeToCompletion = () => 0;
  isComplete = () => true;

  protected getBranchingActions():
    | Error
    | { user: Combatant; actionExecutionIntent: CombatActionExecutionIntent }[] {
    // @TODO - collect all triggered actions and add to branchingActions list
    // if not "countered", set any concurrent sub actions to the branchingActions list
    const branchingActions: {
      user: Combatant;
      actionExecutionIntent: CombatActionExecutionIntent;
    }[] = [];
    return branchingActions;
  }
}
