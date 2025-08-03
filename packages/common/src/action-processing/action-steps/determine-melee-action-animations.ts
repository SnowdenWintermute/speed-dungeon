import { determineMeleeAttackAnimationType } from "../../combat/combat-actions/action-implementations/attack/determine-melee-attack-animation-type.js";
import { COMBAT_ACTIONS, CombatActionExecutionIntent } from "../../combat/index.js";
import { Combatant } from "../../combatants/index.js";
import {
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "./index.js";

// we want to determine the animations before rolling hit outcomes because
// we want a smooth chain of matching chambering, delivery and recovery animations
// which could otherwise be interrupted by starting with a swing chambering, then breaking the weapon
// causing an unarmed recovery, or just starting a swing, then realizing at the hit outcome step
// they they actually want to stab

export class DetermineMeleeActionAnimationsActionResolutionStep extends ActionResolutionStep {
  constructor(context: ActionResolutionStepContext) {
    super(ActionResolutionStepType.DetermineMeleeActionAnimations, context, null);

    const { actionExecutionIntent } = context.tracker;

    const action = COMBAT_ACTIONS[actionExecutionIntent.actionName];
    const { addsPropertiesFromHoldableSlot } = action.hitOutcomeProperties;

    if (addsPropertiesFromHoldableSlot === null) return;

    const meleeAttackAnimationType = determineMeleeAttackAnimationType(
      context,
      addsPropertiesFromHoldableSlot
    );

    context.tracker.meleeAttackAnimationType = meleeAttackAnimationType;
  }

  protected onTick = () => {};
  getTimeToCompletion = () => 0;
  isComplete = () => true;
  getBranchingActions(): { user: Combatant; actionExecutionIntent: CombatActionExecutionIntent }[] {
    return [];
  }
}
