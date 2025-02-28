import { CombatActionAnimationPhase } from "../../combat/combat-actions/combat-action-animations.js";
import { SpawnableEntityType } from "../../spawnables/index.js";
import { CombatantMotionActionResolutionStep } from "./combatant-motion.js";
import { DetermineChildActionsActionResolutionStep } from "./determine-child-actions.js";
import { EvalOnHitOutcomeTriggersActionResolutionStep } from "./hit-outcome-triggers/index.js";
import { EvalOnUseTriggersActionResolutionStep } from "./evaluate-on-use-triggers.js";
import {
  ActionMotionPhase,
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "./index.js";
import { OnActivationVfxMotionActionResolutionStep } from "./on-activation-vfx-motion.js";
import { PayResourceCostsActionResolutionStep } from "./pay-resource-costs.js";
import { RollIncomingHitOutcomesActionResolutionStep } from "./roll-incoming-hit-outcomes.js";
import { SpawnEntityActionResolutionStep } from "./spawn-entity.js";
import { StartConcurrentSubActionsActionResolutionStep } from "./start-concurrent-sub-actions.js";

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
  [ActionResolutionStepType.InitialPositioning]: (context) =>
    new CombatantMotionActionResolutionStep(
      context,
      ActionResolutionStepType.InitialPositioning,
      ActionMotionPhase.Initial,
      CombatActionAnimationPhase.Initial
    ),
  [ActionResolutionStepType.ChamberingMotion]: (context) =>
    new CombatantMotionActionResolutionStep(
      context,
      ActionResolutionStepType.ChamberingMotion,
      ActionMotionPhase.Chambering,
      CombatActionAnimationPhase.Chambering
    ),
  [ActionResolutionStepType.PostChamberingSpawnEntity]: (context) =>
    new SpawnEntityActionResolutionStep(
      context,
      ActionResolutionStepType.PostChamberingSpawnEntity
    ),
  [ActionResolutionStepType.DeliveryMotion]: (context) =>
    new CombatantMotionActionResolutionStep(
      context,
      ActionResolutionStepType.DeliveryMotion,
      ActionMotionPhase.Delivery,
      CombatActionAnimationPhase.Delivery
    ),
  [ActionResolutionStepType.PayResourceCosts]: (context) =>
    new PayResourceCostsActionResolutionStep(context),
  [ActionResolutionStepType.EvalOnUseTriggers]: (context) =>
    new EvalOnUseTriggersActionResolutionStep(context),
  [ActionResolutionStepType.StartConcurrentSubActions]: (context) =>
    new StartConcurrentSubActionsActionResolutionStep(context),
  [ActionResolutionStepType.OnActivationSpawnEntity]: (context) =>
    new SpawnEntityActionResolutionStep(context, ActionResolutionStepType.OnActivationSpawnEntity),
  [ActionResolutionStepType.OnActivationVfxMotion]: (context) => {
    const expectedProjectileEntityOption = context.tracker.spawnedEntityOption;
    if (!expectedProjectileEntityOption) throw new Error("expected projectile was missing");
    if (expectedProjectileEntityOption.type !== SpawnableEntityType.Vfx)
      throw new Error("expected entity was of invalid type");
    return new OnActivationVfxMotionActionResolutionStep(
      context,
      expectedProjectileEntityOption.vfx
    );
  },
  [ActionResolutionStepType.RollIncomingHitOutcomes]: (context) =>
    new RollIncomingHitOutcomesActionResolutionStep(context),
  [ActionResolutionStepType.EvalOnHitOutcomeTriggers]: (context) =>
    new EvalOnHitOutcomeTriggersActionResolutionStep(context),
  [ActionResolutionStepType.RecoveryMotion]: (context) => {
    let animationPhase = CombatActionAnimationPhase.RecoverySuccess;
    if (context.tracker.wasInterrupted)
      animationPhase = CombatActionAnimationPhase.RecoveryInterrupted;
    return new CombatantMotionActionResolutionStep(
      context,
      ActionResolutionStepType.RecoveryMotion,
      ActionMotionPhase.Recovery,
      animationPhase
    );
  },
  [ActionResolutionStepType.FinalPositioning]: (context) =>
    new CombatantMotionActionResolutionStep(
      context,
      ActionResolutionStepType.FinalPositioning,
      ActionMotionPhase.Final,
      CombatActionAnimationPhase.Final
    ),
};
