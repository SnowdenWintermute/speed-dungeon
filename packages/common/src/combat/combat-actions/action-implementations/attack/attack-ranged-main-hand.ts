import {
  CombatActionComponentConfig,
  CombatActionExecutionIntent,
  CombatActionLeaf,
  CombatActionName,
  CombatActionUsabilityContext,
  TargetCategories,
  TargetingScheme,
} from "../../index.js";
import { DEFAULT_COMBAT_ACTION_PERFORMANCE_TIME } from "../../../../app-consts.js";
import { CombatantCondition } from "../../../../combatants/combatant-conditions/index.js";
import { ProhibitedTargetCombatantStates } from "../../prohibited-target-combatant-states.js";
import { ATTACK } from "./index.js";
import {
  Combatant,
  CombatantEquipment,
  CombatantProperties,
} from "../../../../combatants/index.js";
import { CombatAttribute } from "../../../../combatants/attributes/index.js";
import { ActionAccuracyType } from "../../combat-action-accuracy.js";
import { iterateNumericEnum } from "../../../../utils/index.js";
import { EquipmentSlotType, HoldableSlotType } from "../../../../items/equipment/slots.js";
import { Equipment, EquipmentType } from "../../../../items/equipment/index.js";
import { getAttackHpChangeProperties } from "./get-attack-hp-change-properties.js";
import {
  getStandardActionArmorPenetration,
  getStandardActionCritChance,
  getStandardActionCritMultiplier,
} from "../../action-calculation-utils/standard-action-calculations.js";
import { CombatActionIntent } from "../../combat-action-intent.js";
import { AutoTargetingScheme } from "../../../targeting/auto-targeting/index.js";
import {
  ActionMotionPhase,
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
  ActionSequenceManager,
} from "../../../../action-processing/index.js";
import { RANGED_ACTIONS_COMMON_CONFIG } from "../ranged-actions-common-config.js";
import { CombatantContext } from "../../../../combatant-context/index.js";
import { CombatantMotionActionResolutionStep } from "../../../../action-processing/action-steps/combatant-motion.js";
import { CombatActionAnimationPhase } from "../../combat-action-animations.js";
import { SpawnEntityActionResolutionStep } from "../../../../action-processing/action-steps/spawn-entity.js";
import { IdGenerator } from "../../../../utility-classes/index.js";
import { PayResourceCostsActionResolutionStep } from "../../../../action-processing/action-steps/pay-resource-costs.js";
import { EvalOnUseTriggersActionResolutionStep } from "../../../../action-processing/action-steps/evaluate-on-use-triggers.js";
import { ActionTracker } from "../../../../action-processing/action-tracker.js";
import { OnActivationVfxMotionActionResolutionStep } from "../../../../action-processing/action-steps/on-activation-vfx-motion.js";
import { StartConcurrentSubActionsActionResolutionStep } from "../../../../action-processing/action-steps/start-concurrent-sub-actions.js";

const config: CombatActionComponentConfig = {
  ...RANGED_ACTIONS_COMMON_CONFIG,
  description: "Attack target using ranged weapon",
  targetingSchemes: [TargetingScheme.Single],
  validTargetCategories: TargetCategories.Opponent,
  autoTargetSelectionMethod: { scheme: AutoTargetingScheme.UserSelected },
  usabilityContext: CombatActionUsabilityContext.InCombat,
  intent: CombatActionIntent.Malicious,
  prohibitedTargetCombatantStates: [
    ProhibitedTargetCombatantStates.Dead,
    ProhibitedTargetCombatantStates.UntargetableByPhysical,
  ],
  baseHpChangeValuesLevelMultiplier: 1,
  accuracyModifier: 0.9,
  appliesConditions: [],
  incursDurabilityLoss: { [EquipmentSlotType.Holdable]: { [HoldableSlotType.MainHand]: 1 } },
  costBases: {},
  userShouldMoveHomeOnComplete: true,
  getResourceCosts: () => null,
  getExecutionTime: () => DEFAULT_COMBAT_ACTION_PERFORMANCE_TIME,
  requiresCombatTurn: (user) => {
    for (const holdableSlotType of iterateNumericEnum(HoldableSlotType)) {
      const equipmentOption = CombatantEquipment.getEquippedHoldable(user, holdableSlotType);
      if (!equipmentOption) continue;
      const { equipmentType } = equipmentOption.equipmentBaseItemProperties.taggedBaseEquipment;
      if (Equipment.isBroken(equipmentOption)) continue;
      if (Equipment.isTwoHanded(equipmentType)) return true;
      if (equipmentType === EquipmentType.Shield) return true;
    }
    return false;
  },
  shouldExecute: () => true,
  getUnmodifiedAccuracy: (user) => {
    const userCombatAttributes = CombatantProperties.getTotalAttributes(user);
    return {
      type: ActionAccuracyType.Percentage,
      value: userCombatAttributes[CombatAttribute.Accuracy],
    };
  },
  getCritChance: (user) => {
    return getStandardActionCritChance(user, CombatAttribute.Dexterity);
  },
  getCritMultiplier(user) {
    return getStandardActionCritMultiplier(user, CombatAttribute.Dexterity);
  },
  getArmorPenetration(user, self) {
    return getStandardActionArmorPenetration(user, CombatAttribute.Dexterity);
  },
  getHpChangeProperties: (user, primaryTarget, self) => {
    const hpChangeProperties = getAttackHpChangeProperties(
      self,
      user,
      primaryTarget,
      CombatAttribute.Dexterity,
      HoldableSlotType.MainHand
    );
    return hpChangeProperties;
  },
  getAppliedConditions: function (): CombatantCondition[] | null {
    return null; // ex: could make a "poison blade" item
  },
  getConcurrentSubActions(context) {
    const { combatActionTarget } = context.combatant.combatantProperties;
    if (!combatActionTarget) throw new Error("expected combatant target not found");
    return [
      new CombatActionExecutionIntent(
        CombatActionName.AttackRangedMainhandProjectile,
        combatActionTarget
      ),
    ];
  },
  getChildren: () => [],
  getParent: () => ATTACK,
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
        new SpawnEntityActionResolutionStep(
          actionResolutionStepContext,
          tracker,
          ActionResolutionStepType.PostChamberingSpawnEntity,
          idGenerator
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

export const ATTACK_RANGED_MAIN_HAND = new CombatActionLeaf(
  CombatActionName.AttackRangedMainhand,
  config
);
