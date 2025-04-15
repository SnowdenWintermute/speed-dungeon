import {
  ActionPayableResource,
  CombatActionComponent,
  CombatActionComponentConfig,
  CombatActionLeaf,
  CombatActionName,
  CombatActionUsabilityContext,
  TargetCategories,
  TargetingScheme,
} from "../../index.js";
import { AnimationType, SkeletalAnimationName } from "../../../../app-consts.js";
import { CombatantCondition } from "../../../../combatants/combatant-conditions/index.js";
import { ProhibitedTargetCombatantStates } from "../../prohibited-target-combatant-states.js";
import { CombatantProperties, CombatantTraitType } from "../../../../combatants/index.js";
import { CombatActionIntent } from "../../combat-action-intent.js";
import { AutoTargetingScheme } from "../../../targeting/auto-targeting/index.js";
import {
  CombatActionAnimationPhase,
  CombatActionCombatantAnimations,
  getFallbackAnimationWithLength,
} from "../../combat-action-animations.js";
import { AnimationTimingType } from "../../../../action-processing/index.js";
import { CombatActionRequiredRange } from "../../combat-action-range.js";
import { ActionAccuracy, ActionAccuracyType } from "../../combat-action-accuracy.js";
import { RANGED_ACTION_DESTINATION_GETTERS } from "../ranged-action-destination-getters.js";
import {
  HpChangeSource,
  HpChangeSourceCategory,
  HpChangeSourceConfig,
} from "../../../hp-change-source-types.js";
import { NumberRange } from "../../../../primatives/number-range.js";
import { CombatActionHpChangeProperties } from "../../combat-action-hp-change-properties.js";
import { COMMON_CHILD_ACTION_STEPS_SEQUENCE } from "../common-action-steps-sequence.js";
import { randBetween } from "../../../../utils/index.js";
import { CombatAttribute } from "../../../../combatants/attributes/index.js";

const config: CombatActionComponentConfig = {
  description: "Attack target using equipment in main hand",
  targetingSchemes: [TargetingScheme.Single],
  validTargetCategories: TargetCategories.Friendly,
  autoTargetSelectionMethod: { scheme: AutoTargetingScheme.UserSelected },
  usabilityContext: CombatActionUsabilityContext.All,
  intent: CombatActionIntent.Benevolent,
  prohibitedTargetCombatantStates: [
    ProhibitedTargetCombatantStates.Dead,
    ProhibitedTargetCombatantStates.FullHp,
  ],
  baseHpChangeValuesLevelMultiplier: 1,
  accuracyModifier: 1,
  incursDurabilityLoss: {},
  costBases: {
    [ActionPayableResource.QuickActions]: {
      base: 1,
    },
  },
  getResourceCosts: () => null,
  requiresCombatTurn: (context) => false,
  shouldExecute: () => true,
  getActionStepAnimations: (context) => {
    const chamberingAnimation = SkeletalAnimationName.UseConsumableChambering;
    const deliveryAnimation = SkeletalAnimationName.UseConsumableDelivery;
    const recoveryAnimation = SkeletalAnimationName.UseConsumableRecovery;

    const { animationLengths } = context.manager.sequentialActionManagerRegistry;
    const speciesLengths =
      animationLengths[context.combatantContext.combatant.combatantProperties.combatantSpecies];

    const animations: CombatActionCombatantAnimations = {
      [CombatActionAnimationPhase.Initial]: {
        name: { type: AnimationType.Skeletal, name: SkeletalAnimationName.MoveForwardLoop },
        timing: { type: AnimationTimingType.Looping },
      },
      [CombatActionAnimationPhase.Chambering]: getFallbackAnimationWithLength(
        chamberingAnimation,
        speciesLengths
      ),
      [CombatActionAnimationPhase.Delivery]: getFallbackAnimationWithLength(
        deliveryAnimation,
        speciesLengths
      ),
      [CombatActionAnimationPhase.RecoverySuccess]: getFallbackAnimationWithLength(
        recoveryAnimation,
        speciesLengths
      ),
      [CombatActionAnimationPhase.RecoveryInterrupted]: getFallbackAnimationWithLength(
        recoveryAnimation,
        speciesLengths
      ),
      [CombatActionAnimationPhase.Final]: {
        name: { type: AnimationType.Skeletal, name: SkeletalAnimationName.MoveBack },
        timing: { type: AnimationTimingType.Looping },
      },
    };
    return animations;
  },
  getHpChangeProperties: (user, primaryTarget, self) => {
    const hpChangeSourceConfig: HpChangeSourceConfig = {
      category: HpChangeSourceCategory.Magical,
      isHealing: true,
    };

    let hpBioavailability = 1;
    for (const trait of primaryTarget.traits) {
      if (trait.type === CombatantTraitType.HpBioavailability)
        hpBioavailability = trait.percent / 100;
    }
    const maxHp = CombatantProperties.getTotalAttributes(primaryTarget)[CombatAttribute.Hp];
    const minHealing = (hpBioavailability * maxHp) / 8;
    const maxHealing = (hpBioavailability * 3 * maxHp) / 8;

    const hpChangeSource = new HpChangeSource(hpChangeSourceConfig);
    const hpChangeProperties: CombatActionHpChangeProperties = {
      hpChangeSource,
      baseValues: new NumberRange(1, randBetween(minHealing, maxHealing)),
    };

    return hpChangeProperties;
  },
  getAppliedConditions: function (context): CombatantCondition[] | null {
    return null;
  },
  getChildren: () => [],
  getParent: () => null,
  userShouldMoveHomeOnComplete: true,
  getRequiredRange: () => CombatActionRequiredRange.Ranged,
  getUnmodifiedAccuracy: function (user: CombatantProperties): ActionAccuracy {
    return {
      type: ActionAccuracyType.Unavoidable,
    };
  },

  getIsParryable: (user: CombatantProperties) => false,
  getCanTriggerCounterattack: (user: CombatantProperties) => false,
  getIsBlockable: (user: CombatantProperties) => false,

  getCritChance: function (user: CombatantProperties): number {
    return 0;
  },
  getCritMultiplier: function (user: CombatantProperties): number {
    return 0;
  },
  getArmorPenetration: function (user: CombatantProperties, self: CombatActionComponent): number {
    return 0;
  },
  getResolutionSteps: () => COMMON_CHILD_ACTION_STEPS_SEQUENCE,
  motionPhasePositionGetters: RANGED_ACTION_DESTINATION_GETTERS,
};

export const USE_GREEN_AUTOINJECTOR = new CombatActionLeaf(
  CombatActionName.UseGreenAutoinjector,
  config
);
