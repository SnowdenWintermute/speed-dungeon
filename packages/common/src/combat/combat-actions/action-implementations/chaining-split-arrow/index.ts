import {
  ActionPayableResource,
  ActionResourceCosts,
  CombatActionComponent,
  CombatActionComponentConfig,
  CombatActionComposite,
  CombatActionExecutionIntent,
  CombatActionName,
  CombatActionUsabilityContext,
  TargetCategories,
  TargetingScheme,
} from "../../index.js";
import { CombatantProperties } from "../../../../combatants/index.js";
import { CombatantCondition } from "../../../../combatants/combatant-conditions/index.js";
import { ProhibitedTargetCombatantStates } from "../../prohibited-target-combatant-states.js";
import { ActionAccuracy } from "../../combat-action-accuracy.js";
import { CombatActionRequiredRange } from "../../combat-action-range.js";
import { AutoTargetingScheme } from "../../../targeting/auto-targeting/index.js";
import { CombatActionIntent } from "../../combat-action-intent.js";
import { CombatActionTargetType } from "../../../targeting/combat-action-targets.js";
import { CombatantContext } from "../../../../combatant-context/index.js";
import { ActionSequenceManager } from "../../../../action-processing/action-sequence-manager.js";
import { RANGED_ACTIONS_COMMON_CONFIG } from "../ranged-actions-common-config.js";
import {
  ActionMotionPhase,
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "../../../../action-processing/index.js";
import { AnimationName } from "../../../../app-consts.js";
import { CombatantMotionActionResolutionStep } from "../../../../action-processing/action-steps/combatant-motion.js";
import { PayResourceCostsActionResolutionStep } from "../../../../action-processing/action-steps/pay-resource-costs.js";
import { EvalOnUseTriggersActionResolutionStep } from "../../../../action-processing/action-steps/evaluate-on-use-triggers.js";
import { StartConcurrentSubActionsActionResolutionStep } from "../../../../action-processing/action-steps/start-concurrent-sub-actions.js";
import { CombatActionAnimationPhase } from "../../combat-action-animations.js";
import { ActionTracker } from "../../../../action-processing/action-tracker.js";
import { IdGenerator } from "../../../../utility-classes/index.js";

const config: CombatActionComponentConfig = {
  ...RANGED_ACTIONS_COMMON_CONFIG,
  description: "Fire arrows which each bounce to up to two additional targets",
  targetingSchemes: [TargetingScheme.Area],
  validTargetCategories: TargetCategories.Opponent,
  autoTargetSelectionMethod: { scheme: AutoTargetingScheme.UserSelected },
  usabilityContext: CombatActionUsabilityContext.InCombat,
  intent: CombatActionIntent.Malicious,
  prohibitedTargetCombatantStates: [
    ProhibitedTargetCombatantStates.Dead,
    ProhibitedTargetCombatantStates.UntargetableByPhysical,
  ],
  baseHpChangeValuesLevelMultiplier: 1,
  accuracyModifier: 1,
  appliesConditions: [],
  incursDurabilityLoss: {},
  costBases: {},
  userShouldMoveHomeOnComplete: true,
  getResourceCosts: () => {
    const costs: ActionResourceCosts = {
      [ActionPayableResource.Mana]: 1,
    };
    return costs;
  },
  getExecutionTime: () => 1000,
  requiresCombatTurn: () => true,
  shouldExecute: () => true,
  getHpChangeProperties: () => null,
  getAppliedConditions: function (): CombatantCondition[] | null {
    // @TODO - determine based on equipment
    throw new Error("Function not implemented.");
  },
  getChildren: (_user) => [],
  getParent: () => null,
  getRequiredRange: (_user, _self) => CombatActionRequiredRange.Ranged,
  getConcurrentSubActions(combatantContext) {
    return combatantContext.getOpponents().map(
      (opponent) =>
        new CombatActionExecutionIntent(CombatActionName.ChainingSplitArrowProjectile, {
          type: CombatActionTargetType.Single,
          targetId: opponent.entityProperties.id,
        })
    );
  },
  getUnmodifiedAccuracy: function (user: CombatantProperties): ActionAccuracy {
    throw new Error("Function not implemented.");
  },
  getCritChance: function (user: CombatantProperties): number {
    throw new Error("Function not implemented.");
  },
  getCritMultiplier: function (user: CombatantProperties): number {
    throw new Error("Function not implemented.");
  },
  getArmorPenetration: function (user: CombatantProperties, self: CombatActionComponent): number {
    throw new Error("Function not implemented.");
  },
  getResolutionSteps(
    combatantContext: CombatantContext,
    actionExecutionIntent: CombatActionExecutionIntent,
    tracker: ActionTracker,
    previousTrackerOption: null | ActionTracker,
    manager: ActionSequenceManager,
    idGenerator: IdGenerator
  ): Error | (() => ActionResolutionStep)[] {
    const actionResolutionStepContext: ActionResolutionStepContext = {
      combatantContext,
      actionExecutionIntent,
      manager,
      previousStepOption: null,
    };

    return [
      () =>
        new CombatantMotionActionResolutionStep(
          actionResolutionStepContext,
          ActionResolutionStepType.InitialPositioning,
          ActionMotionPhase.Initial,
          CombatActionAnimationPhase.Initial
        ),
      () =>
        new CombatantMotionActionResolutionStep(
          actionResolutionStepContext,
          ActionResolutionStepType.ChamberingMotion,
          ActionMotionPhase.Chambering,
          CombatActionAnimationPhase.Chambering
        ),
      () =>
        new CombatantMotionActionResolutionStep(
          actionResolutionStepContext,
          ActionResolutionStepType.DeliveryMotion,
          ActionMotionPhase.Delivery,
          CombatActionAnimationPhase.Delivery
        ),
      () => new PayResourceCostsActionResolutionStep(actionResolutionStepContext),
      () => new EvalOnUseTriggersActionResolutionStep(actionResolutionStepContext, tracker),
      () => new StartConcurrentSubActionsActionResolutionStep(actionResolutionStepContext, tracker),
      () => {
        let animationPhase = CombatActionAnimationPhase.RecoverySuccess;
        if (tracker.wasInterrupted) animationPhase = CombatActionAnimationPhase.RecoveryInterrupted;
        return new CombatantMotionActionResolutionStep(
          actionResolutionStepContext,
          ActionResolutionStepType.RecoveryMotion,
          ActionMotionPhase.Recovery,
          animationPhase
        );
      },
      () =>
        new CombatantMotionActionResolutionStep(
          actionResolutionStepContext,
          ActionResolutionStepType.FinalPositioning,
          ActionMotionPhase.Final,
          CombatActionAnimationPhase.Final
        ),
    ];
  },
  motionPhasePositionGetters: {},
};

export const CHAINING_SPLIT_ARROW_PARENT = new CombatActionComposite(
  CombatActionName.ChainingSplitArrowParent,
  config
);
