import { DetermineChildActionsActionResolutionStep } from "./determine-child-actions.js";
import { EvalOnHitOutcomeTriggersActionResolutionStep } from "./hit-outcome-triggers/index.js";
import { EvalOnUseTriggersActionResolutionStep } from "./evaluate-on-use-triggers.js";
import {
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "./index.js";
import { PayResourceCostsActionResolutionStep } from "./pay-resource-costs.js";
import { RollIncomingHitOutcomesActionResolutionStep } from "./roll-incoming-hit-outcomes.js";
import { StartConcurrentSubActionsActionResolutionStep } from "./start-concurrent-sub-actions.js";
import { DetermineMeleeActionAnimationsActionResolutionStep } from "./determine-melee-action-animations.js";
import { EvaluatePlayerEndTurnAndInputLockActionResolutionStep } from "./evaluate-player-turn-end-and-input-lock.js";
import { DetermineShouldExecuteOrReleaseTurnLockActionResolutionStep } from "./determine-should-execute-or-release-turn-and-input-lock.js";
import { CombatantMotionActionResolutionStep } from "./motion-steps/combatant-motion.js";
import { ActionEntityMotionActionResolutionStep } from "./motion-steps/action-entity-motion.js";
import { TriggerEnvironmentalHazardsActionResolutionStep } from "./motion-steps/determine-environmental-hazard-triggers.js";
import { RemoveTickedConditionStacksActionResolutionStep } from "./remove-ticked-condition-stacks.js";
import { WaitForDelayActionResolutionStep } from "./motion-steps/wait-for-delay.js";
import { SpawnEntitiesActionResolutionStep } from "./spawn-entities.js";
import { PostGameLogMessageActionResolutionStep } from "./post-game-log-message.js";

// right now the idea is to have the action tracker call these creators, which in turn call
// step class constructors. We don't call the constructors directly because this allows us
// to configure them with parameters so we can reuse certain step types like CombatantMotion
// and we don't construct them all at once becasue when they are constructed is when we
// want to add their game update command to the replay list

export const ACTION_STEP_CREATORS: Record<
  ActionResolutionStepType,
  (context: ActionResolutionStepContext) => ActionResolutionStep
> = {
  [ActionResolutionStepType.PreInitialPositioningDetermineShouldExecuteOrReleaseTurnLock]: (
    context
  ) =>
    new DetermineShouldExecuteOrReleaseTurnLockActionResolutionStep(
      context,
      ActionResolutionStepType.PreInitialPositioningDetermineShouldExecuteOrReleaseTurnLock
    ),
  [ActionResolutionStepType.DetermineChildActions]: (context) =>
    new DetermineChildActionsActionResolutionStep(context),
  [ActionResolutionStepType.DetermineMeleeActionAnimations]: (context) =>
    new DetermineMeleeActionAnimationsActionResolutionStep(context),
  [ActionResolutionStepType.PreInitialPositioningCheckEnvironmentalHazardTriggers]: (context) =>
    new TriggerEnvironmentalHazardsActionResolutionStep(
      context,
      ActionResolutionStepType.PreInitialPositioningCheckEnvironmentalHazardTriggers
    ),
  [ActionResolutionStepType.InitialPositioning]: (context) =>
    new CombatantMotionActionResolutionStep(context, ActionResolutionStepType.InitialPositioning),
  [ActionResolutionStepType.WaitForInitialDelay]: (context) =>
    new WaitForDelayActionResolutionStep(context, ActionResolutionStepType.WaitForInitialDelay),
  [ActionResolutionStepType.PostInitialPositioningDetermineShouldExecuteOrReleaseTurnLock]: (
    context
  ) =>
    new DetermineShouldExecuteOrReleaseTurnLockActionResolutionStep(
      context,
      ActionResolutionStepType.PostInitialPositioningDetermineShouldExecuteOrReleaseTurnLock
    ),
  [ActionResolutionStepType.PrepMotion]: (context) =>
    new CombatantMotionActionResolutionStep(context, ActionResolutionStepType.PrepMotion),
  [ActionResolutionStepType.PostPrepSpawnEntity]: (context) =>
    new SpawnEntitiesActionResolutionStep(context, ActionResolutionStepType.PostPrepSpawnEntity),
  [ActionResolutionStepType.ChamberingMotion]: (context) =>
    new CombatantMotionActionResolutionStep(context, ActionResolutionStepType.ChamberingMotion),
  [ActionResolutionStepType.DeliveryMotion]: (context) =>
    new CombatantMotionActionResolutionStep(context, ActionResolutionStepType.DeliveryMotion),
  [ActionResolutionStepType.PayResourceCosts]: (context) =>
    new PayResourceCostsActionResolutionStep(context),
  [ActionResolutionStepType.PostActionUseGameLogMessage]: (context) =>
    new PostGameLogMessageActionResolutionStep(
      context,
      ActionResolutionStepType.PostActionUseGameLogMessage
    ),
  [ActionResolutionStepType.EvalOnUseTriggers]: (context) =>
    new EvalOnUseTriggersActionResolutionStep(context),
  [ActionResolutionStepType.StartConcurrentSubActions]: (context) =>
    new StartConcurrentSubActionsActionResolutionStep(context),
  [ActionResolutionStepType.OnActivationSpawnEntity]: (context) =>
    new SpawnEntitiesActionResolutionStep(
      context,
      ActionResolutionStepType.OnActivationSpawnEntity
    ),
  [ActionResolutionStepType.PreActionEntityMotionCheckEnvironmentalHazardTriggers]: (context) =>
    new TriggerEnvironmentalHazardsActionResolutionStep(
      context,
      ActionResolutionStepType.PreActionEntityMotionCheckEnvironmentalHazardTriggers
    ),
  [ActionResolutionStepType.OnActivationActionEntityMotion]: (context) => {
    return new ActionEntityMotionActionResolutionStep(
      context,
      ActionResolutionStepType.OnActivationActionEntityMotion
    );
  },
  [ActionResolutionStepType.RollIncomingHitOutcomes]: (context) =>
    new RollIncomingHitOutcomesActionResolutionStep(context),
  [ActionResolutionStepType.EvalOnHitOutcomeTriggers]: (context) =>
    new EvalOnHitOutcomeTriggersActionResolutionStep(context),
  [ActionResolutionStepType.PostOnResolutionGameLogMessage]: (context) =>
    new PostGameLogMessageActionResolutionStep(
      context,
      ActionResolutionStepType.PostOnResolutionGameLogMessage
    ),
  [ActionResolutionStepType.PreFinalPositioningCheckEnvironmentalHazardTriggers]: (context) =>
    new TriggerEnvironmentalHazardsActionResolutionStep(
      context,
      ActionResolutionStepType.PreFinalPositioningCheckEnvironmentalHazardTriggers
    ),
  [ActionResolutionStepType.EvaluatePlayerEndTurnAndInputLock]: (context) =>
    new EvaluatePlayerEndTurnAndInputLockActionResolutionStep(context),
  [ActionResolutionStepType.RemoveTickedConditionStacks]: (context) =>
    new RemoveTickedConditionStacksActionResolutionStep(context),
  [ActionResolutionStepType.ActionEntityDissipationMotion]: (context) => {
    return new ActionEntityMotionActionResolutionStep(
      context,
      ActionResolutionStepType.ActionEntityDissipationMotion
    );
  },
  [ActionResolutionStepType.RecoveryMotion]: (context) => {
    return new CombatantMotionActionResolutionStep(
      context,
      ActionResolutionStepType.RecoveryMotion
    );
  },
  [ActionResolutionStepType.FinalPositioning]: (context) =>
    new CombatantMotionActionResolutionStep(context, ActionResolutionStepType.FinalPositioning),
};
