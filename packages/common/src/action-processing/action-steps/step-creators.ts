import { SpawnableEntityType } from "../../spawnables/index.js";
import { CombatantMotionActionResolutionStep } from "./combatant-motion.js";
import { DetermineChildActionsActionResolutionStep } from "./determine-child-actions.js";
import { EvalOnHitOutcomeTriggersActionResolutionStep } from "./hit-outcome-triggers/index.js";
import { EvalOnUseTriggersActionResolutionStep } from "./evaluate-on-use-triggers.js";
import {
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "./index.js";
import { ActionEntityMotionActionResolutionStep } from "./action-entity-motion.js";
import { PayResourceCostsActionResolutionStep } from "./pay-resource-costs.js";
import { RollIncomingHitOutcomesActionResolutionStep } from "./roll-incoming-hit-outcomes.js";
import { SpawnEntityActionResolutionStep } from "./spawn-entity.js";
import { StartConcurrentSubActionsActionResolutionStep } from "./start-concurrent-sub-actions.js";
import { DetermineMeleeActionAnimationsActionResolutionStep } from "./determine-melee-action-animations.js";

// right now the idea is to have the action tracker call these creators, which in turn call
// step class constructors. We don't call the constructors directly because this allows us
// to configure them with parameters so we can reuse certain step types like CombatantMotion
// and we don't construct them all at once becasue when they are constructed is when we
// want to add their game update command to the replay list

export const ACTION_STEP_CREATORS: Record<
  ActionResolutionStepType,
  (context: ActionResolutionStepContext) => ActionResolutionStep
> = {
  [ActionResolutionStepType.DetermineChildActions]: (context) =>
    new DetermineChildActionsActionResolutionStep(context),
  [ActionResolutionStepType.DetermineMeleeActionAnimations]: (context) =>
    new DetermineMeleeActionAnimationsActionResolutionStep(context),
  [ActionResolutionStepType.InitialPositioning]: (context) =>
    new CombatantMotionActionResolutionStep(context, ActionResolutionStepType.InitialPositioning),
  [ActionResolutionStepType.ChamberingMotion]: (context) =>
    new CombatantMotionActionResolutionStep(context, ActionResolutionStepType.ChamberingMotion),
  [ActionResolutionStepType.PostChamberingSpawnEntity]: (context) =>
    new SpawnEntityActionResolutionStep(
      context,
      ActionResolutionStepType.PostChamberingSpawnEntity
    ),
  [ActionResolutionStepType.DeliveryMotion]: (context) =>
    new CombatantMotionActionResolutionStep(context, ActionResolutionStepType.DeliveryMotion),
  [ActionResolutionStepType.PayResourceCosts]: (context) =>
    new PayResourceCostsActionResolutionStep(context),
  [ActionResolutionStepType.EvalOnUseTriggers]: (context) =>
    new EvalOnUseTriggersActionResolutionStep(context),
  [ActionResolutionStepType.StartConcurrentSubActions]: (context) =>
    new StartConcurrentSubActionsActionResolutionStep(context),
  [ActionResolutionStepType.OnActivationSpawnEntity]: (context) =>
    new SpawnEntityActionResolutionStep(context, ActionResolutionStepType.OnActivationSpawnEntity),
  [ActionResolutionStepType.OnActivationActionEntityMotion]: (context) => {
    const expectedProjectileEntityOption = context.tracker.spawnedEntityOption;
    if (!expectedProjectileEntityOption) throw new Error("expected projectile was missing");
    if (expectedProjectileEntityOption.type !== SpawnableEntityType.ActionEntity)
      throw new Error("expected entity was of invalid type");
    return new ActionEntityMotionActionResolutionStep(
      context,
      ActionResolutionStepType.OnActivationActionEntityMotion,
      expectedProjectileEntityOption.actionEntity
    );
  },
  [ActionResolutionStepType.RollIncomingHitOutcomes]: (context) =>
    new RollIncomingHitOutcomesActionResolutionStep(context),
  [ActionResolutionStepType.EvalOnHitOutcomeTriggers]: (context) =>
    new EvalOnHitOutcomeTriggersActionResolutionStep(context),

  [ActionResolutionStepType.ActionEntityDissipationMotion]: (context) => {
    const expectedProjectileEntityOption = context.tracker.spawnedEntityOption;
    if (!expectedProjectileEntityOption) throw new Error("expected projectile was missing");
    if (expectedProjectileEntityOption.type !== SpawnableEntityType.ActionEntity)
      throw new Error("expected entity was of invalid type");
    return new ActionEntityMotionActionResolutionStep(
      context,
      ActionResolutionStepType.ActionEntityDissipationMotion,
      expectedProjectileEntityOption.actionEntity
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
