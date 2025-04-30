import {
  CombatActionComponentConfig,
  CombatActionLeaf,
  CombatActionName,
  CombatActionUsabilityContext,
} from "../../index.js";
import {
  AnimationType,
  SkeletalAnimationName,
  OFF_HAND_ACCURACY_MODIFIER,
  OFF_HAND_CRIT_CHANCE_MODIFIER,
  OFF_HAND_DAMAGE_MODIFIER,
} from "../../../../app-consts.js";
import { ATTACK } from "./index.js";
import { CombatantProperties } from "../../../../combatants/index.js";
import { CombatAttribute } from "../../../../combatants/attributes/index.js";
import { EquipmentSlotType, HoldableSlotType } from "../../../../items/equipment/slots.js";
import { getAttackResourceChangeProperties } from "./get-attack-hp-change-properties.js";
import { CombatActionIntent } from "../../combat-action-intent.js";
import { getStandardActionCritChance } from "../../action-calculation-utils/standard-action-calculations.js";
import { MELEE_ATTACK_COMMON_CONFIG } from "../melee-actions-common-config.js";
import { AnimationTimingType } from "../../../../action-processing/game-update-commands.js";
import { DurabilityLossCondition } from "../../combat-action-durability-loss-condition.js";
import { DAMAGING_ACTIONS_COMMON_CONFIG } from "../damaging-actions-common-config.js";
import {
  GENERIC_TARGETING_PROPERTIES,
  TargetingPropertiesTypes,
} from "../../combat-action-targeting-properties.js";
import {
  ActionHitOutcomePropertiesBaseTypes,
  CombatActionHitOutcomeProperties,
  GENERIC_HIT_OUTCOME_PROPERTIES,
} from "../../combat-action-hit-outcome-properties.js";
import {
  ActionCostPropertiesBaseTypes,
  BASE_ACTION_COST_PROPERTIES,
} from "../../combat-action-cost-properties.js";
import { ActionResolutionStepsConfig } from "../../combat-action-steps-config.js";
import { ActionResolutionStepType } from "../../../../action-processing/index.js";
import { getMeleeAttackDestination } from "../../combat-action-destination-getters.js";
import { getMeleeAttackAnimationFromType } from "./melee-attack-animation-names.js";
import { ActionExecutionPhase } from "./determine-melee-attack-animation-type.js";
import { getHomeDestination } from "../common-destination-getters.js";

const targetingProperties =
  GENERIC_TARGETING_PROPERTIES[TargetingPropertiesTypes.HostileCopyParent];

const hitOutcomeProperties: CombatActionHitOutcomeProperties = {
  ...GENERIC_HIT_OUTCOME_PROPERTIES[ActionHitOutcomePropertiesBaseTypes.Melee],
  accuracyModifier: OFF_HAND_ACCURACY_MODIFIER,
  addsPropertiesFromHoldableSlot: HoldableSlotType.OffHand,
  getCritChance: function (user: CombatantProperties): number {
    return (
      getStandardActionCritChance(user, CombatAttribute.Dexterity) * OFF_HAND_CRIT_CHANCE_MODIFIER
    );
  },
  getHpChangeProperties: (user, primaryTarget) => {
    const hpChangeProperties = getAttackResourceChangeProperties(
      hitOutcomeProperties,
      user,
      primaryTarget,
      CombatAttribute.Strength,
      HoldableSlotType.OffHand
    );
    if (hpChangeProperties instanceof Error) return hpChangeProperties;

    hpChangeProperties.baseValues.mult(OFF_HAND_DAMAGE_MODIFIER);
    return hpChangeProperties;
  },
};

const config: CombatActionComponentConfig = {
  ...MELEE_ATTACK_COMMON_CONFIG,
  ...DAMAGING_ACTIONS_COMMON_CONFIG,
  description: "Attack target using equipment in off hand",
  targetingProperties,
  hitOutcomeProperties,
  costProperties: {
    ...BASE_ACTION_COST_PROPERTIES[ActionCostPropertiesBaseTypes.Base],
    incursDurabilityLoss: {
      [EquipmentSlotType.Holdable]: { [HoldableSlotType.OffHand]: DurabilityLossCondition.OnHit },
    },
  },
  intent: CombatActionIntent.Malicious,
  usabilityContext: CombatActionUsabilityContext.InCombat,

  stepsConfig: new ActionResolutionStepsConfig(
    {
      [ActionResolutionStepType.DetermineActionAnimations]: {},
      [ActionResolutionStepType.InitialPositioning]: {
        getDestination: getMeleeAttackDestination,
      },
      [ActionResolutionStepType.ChamberingMotion]: {
        getAnimation: (user, animationLengths, meleeAttackAnimationType) => {
          if (meleeAttackAnimationType === undefined)
            throw new Error("Expected meleeAttackAnimationType was undefined");
          return getMeleeAttackAnimationFromType(
            user,
            animationLengths,
            meleeAttackAnimationType,
            ActionExecutionPhase.Chambering,
            HoldableSlotType.OffHand
          );
        },
      },
      [ActionResolutionStepType.DeliveryMotion]: {
        getAnimation: (user, animationLengths, meleeAttackAnimationType) => {
          if (meleeAttackAnimationType === undefined)
            throw new Error("Expected meleeAttackAnimationType was undefined");
          return getMeleeAttackAnimationFromType(
            user,
            animationLengths,
            meleeAttackAnimationType,
            ActionExecutionPhase.Delivery,
            HoldableSlotType.OffHand
          );
        },
      },
      [ActionResolutionStepType.PayResourceCosts]: {},
      [ActionResolutionStepType.EvalOnUseTriggers]: {},
      [ActionResolutionStepType.RollIncomingHitOutcomes]: {},
      [ActionResolutionStepType.EvalOnHitOutcomeTriggers]: {},
      [ActionResolutionStepType.RecoveryMotion]: {
        getAnimation: (user, animationLengths, meleeAttackAnimationType) => {
          if (meleeAttackAnimationType === undefined)
            throw new Error("Expected meleeAttackAnimationType was undefined");
          return getMeleeAttackAnimationFromType(
            user,
            animationLengths,
            meleeAttackAnimationType,
            ActionExecutionPhase.Recovery,
            HoldableSlotType.OffHand
          );
        },
      },
      [ActionResolutionStepType.FinalPositioning]: {
        isConditionalStep: true,
        getAnimation: () => {
          return {
            name: { type: AnimationType.Skeletal, name: SkeletalAnimationName.MoveBack },
            timing: { type: AnimationTimingType.Looping },
          };
        },
        getDestination: getHomeDestination,
      },
    },
    true
  ),
  getChildren: () => [],
  getParent: () => ATTACK,
};

export const ATTACK_MELEE_OFF_HAND = new CombatActionLeaf(
  CombatActionName.AttackMeleeOffhand,
  config
);

// getResolutionSteps: () => COMMON_CHILD_ACTION_STEPS_SEQUENCE,
// getActionStepAnimations: (context) => {
//   // @TODO - somehow combine with mainhand animation determinations
//   // we need to see what type of damage we want to do to determine the correct animation
//   const { party } = context.combatantContext;
//   const { actionExecutionIntent } = context.tracker;

//   const targetingCalculator = new TargetingCalculator(context.combatantContext, null);
//   const action = COMBAT_ACTIONS[actionExecutionIntent.actionName];

//   const primaryTargetResult = targetingCalculator.getPrimaryTargetCombatant(
//     party,
//     actionExecutionIntent
//   );
//   if (primaryTargetResult instanceof Error) return primaryTargetResult;
//   const target = primaryTargetResult;

//   const targetIdsResult = targetingCalculator.getCombatActionTargetIds(
//     action,
//     actionExecutionIntent.targets
//   );
//   if (targetIdsResult instanceof Error) return targetIdsResult;
//   const targetIds = targetIdsResult;

//   const actionHpChangePropertiesOption = cloneDeep(
//     action.hitOutcomeProperties.getHpChangeProperties(
//       context.combatantContext.combatant.combatantProperties,
//       target.combatantProperties
//     )
//   );
//   const incomingResourceChangePerTargetOption = getIncomingResourceChangePerTarget(
//     targetIds,
//     actionHpChangePropertiesOption
//   );

//   let chamberingAnimation = SkeletalAnimationName.OffHandSwingChambering;
//   let deliveryAnimation = SkeletalAnimationName.OffHandSwingDelivery;
//   let recoveryAnimation = SkeletalAnimationName.OffHandSwingRecovery;

//   const { combatantProperties } = context.combatantContext.combatant;

//   const offhandEquipmentOption = CombatantEquipment.getEquippedHoldable(
//     combatantProperties,
//     HoldableSlotType.OffHand
//   );

//   if (
//     !offhandEquipmentOption ||
//     Equipment.isBroken(offhandEquipmentOption) ||
//     offhandEquipmentOption.equipmentBaseItemProperties.equipmentType === EquipmentType.Shield
//   ) {
//     chamberingAnimation = SkeletalAnimationName.OffHandUnarmedChambering;
//     deliveryAnimation = SkeletalAnimationName.OffHandUnarmedDelivery;
//     recoveryAnimation = SkeletalAnimationName.OffHandUnarmedRecovery;
//   } else {
//     if (incomingResourceChangePerTargetOption) {
//       const { kineticDamageTypeOption } =
//         incomingResourceChangePerTargetOption.resourceChangeSource;
//       if (kineticDamageTypeOption !== undefined)
//         switch (kineticDamageTypeOption) {
//           case KineticDamageType.Blunt:
//           case KineticDamageType.Slashing:
//             break;
//           case KineticDamageType.Piercing:
//             chamberingAnimation = SkeletalAnimationName.OffHandStabChambering;
//             deliveryAnimation = SkeletalAnimationName.OffHandStabDelivery;
//             recoveryAnimation = SkeletalAnimationName.OffHandStabRecovery;
//         }
//     }
//   }

//   const { animationLengths } = context.manager.sequentialActionManagerRegistry;
//   const speciesLengths =
//     animationLengths[context.combatantContext.combatant.combatantProperties.combatantSpecies];

//   const animations: CombatActionCombatantAnimations = {
//     [CombatActionAnimationPhase.Chambering]: getFallbackAnimationWithLength(
//       chamberingAnimation,
//       speciesLengths
//     ),
//     [CombatActionAnimationPhase.Delivery]: getFallbackAnimationWithLength(
//       deliveryAnimation,
//       speciesLengths
//     ),
//     [CombatActionAnimationPhase.RecoverySuccess]: getFallbackAnimationWithLength(
//       recoveryAnimation,
//       speciesLengths
//     ),
//     [CombatActionAnimationPhase.RecoveryInterrupted]: getFallbackAnimationWithLength(
//       recoveryAnimation,
//       speciesLengths
//     ),
//     [CombatActionAnimationPhase.Final]: {
//       name: { type: AnimationType.Skeletal, name: SkeletalAnimationName.MoveBack },
//       timing: { type: AnimationTimingType.Looping },
//     },
//   };
//   return animations;
// },
