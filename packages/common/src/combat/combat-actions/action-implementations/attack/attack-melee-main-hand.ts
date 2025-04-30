import {
  CombatActionComponentConfig,
  CombatActionLeaf,
  CombatActionName,
  CombatActionUsabilityContext,
} from "../../index.js";
import { ATTACK } from "./index.js";
import { CombatantEquipment } from "../../../../combatants/index.js";
import { iterateNumericEnum } from "../../../../utils/index.js";
import { EquipmentSlotType, HoldableSlotType } from "../../../../items/equipment/slots.js";
import { Equipment, EquipmentType } from "../../../../items/equipment/index.js";
import { CombatActionIntent } from "../../combat-action-intent.js";
import { MELEE_ATTACK_COMMON_CONFIG } from "../melee-actions-common-config.js";
import { DurabilityLossCondition } from "../../combat-action-durability-loss-condition.js";
import {
  GENERIC_TARGETING_PROPERTIES,
  TargetingPropertiesTypes,
} from "../../combat-action-targeting-properties.js";
import {
  ActionHitOutcomePropertiesBaseTypes,
  GENERIC_HIT_OUTCOME_PROPERTIES,
} from "../../combat-action-hit-outcome-properties.js";
import {
  ActionCostPropertiesBaseTypes,
  BASE_ACTION_COST_PROPERTIES,
} from "../../combat-action-cost-properties.js";
import { ActionResolutionStepsConfig } from "../../combat-action-steps-config.js";
import {
  ActionResolutionStepType,
  AnimationTimingType,
} from "../../../../action-processing/index.js";
import { getMeleeAttackDestination } from "../../combat-action-destination-getters.js";
import { AnimationType, SkeletalAnimationName } from "../../../../app-consts.js";
import { getMeleeAttackAnimationFromType } from "./melee-attack-animation-names.js";
import { ActionExecutionPhase } from "./determine-melee-attack-animation-type.js";
import { getHomeDestination } from "../common-destination-getters.js";

const config: CombatActionComponentConfig = {
  ...MELEE_ATTACK_COMMON_CONFIG,
  description: "Attack target using equipment in main hand",
  targetingProperties: GENERIC_TARGETING_PROPERTIES[TargetingPropertiesTypes.HostileCopyParent],
  costProperties: {
    ...BASE_ACTION_COST_PROPERTIES[ActionCostPropertiesBaseTypes.Base],
    incursDurabilityLoss: {
      [EquipmentSlotType.Holdable]: { [HoldableSlotType.MainHand]: DurabilityLossCondition.OnHit },
    },
    requiresCombatTurn: (context) => {
      for (const holdableSlotType of iterateNumericEnum(HoldableSlotType)) {
        const equipmentOption = CombatantEquipment.getEquippedHoldable(
          context.combatantContext.combatant.combatantProperties,
          holdableSlotType
        );
        if (!equipmentOption) continue;
        const { equipmentType } = equipmentOption.equipmentBaseItemProperties.taggedBaseEquipment;
        if (Equipment.isBroken(equipmentOption)) continue;
        if (Equipment.isTwoHanded(equipmentType)) return true;
        if (equipmentType === EquipmentType.Shield) return true;
      }
      return false;
    },
  },
  hitOutcomeProperties: {
    ...GENERIC_HIT_OUTCOME_PROPERTIES[ActionHitOutcomePropertiesBaseTypes.Melee],
    addsPropertiesFromHoldableSlot: HoldableSlotType.MainHand,
  },
  stepsConfig: new ActionResolutionStepsConfig(
    {
      [ActionResolutionStepType.DetermineActionAnimations]: {},
      [ActionResolutionStepType.InitialPositioning]: {
        getDestination: getMeleeAttackDestination,
        getAnimation: () => {
          return {
            name: { type: AnimationType.Skeletal, name: SkeletalAnimationName.MoveForwardLoop },
            timing: { type: AnimationTimingType.Looping },
          };
        },
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
            HoldableSlotType.MainHand
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
            HoldableSlotType.MainHand
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
            HoldableSlotType.MainHand
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
  usabilityContext: CombatActionUsabilityContext.InCombat,
  intent: CombatActionIntent.Malicious,

  shouldExecute: () => true,
  getChildren: () => [],
  getParent: () => ATTACK,
};

export const ATTACK_MELEE_MAIN_HAND = new CombatActionLeaf(
  CombatActionName.AttackMeleeMainhand,
  config
);

// getActionStepAnimations: (context) => {
//   let chamberingAnimation = SkeletalAnimationName.MainHandSwingChambering;
//   let deliveryAnimation = SkeletalAnimationName.MainHandSwingDelivery;
//   let recoveryAnimation = SkeletalAnimationName.MainHandSwingRecovery;

//   const { animationLengths } = context.manager.sequentialActionManagerRegistry;
//   const speciesLengths =
//     animationLengths[context.combatantContext.combatant.combatantProperties.combatantSpecies];

//   const { combatantProperties } = context.combatantContext.combatant;

//   const mainhandEquipmentOption = CombatantEquipment.getEquippedHoldable(
//     combatantProperties,
//     HoldableSlotType.MainHand
//   );

//   if (
//     !mainhandEquipmentOption ||
//     Equipment.isBroken(mainhandEquipmentOption) ||
//     mainhandEquipmentOption.equipmentBaseItemProperties.equipmentType === EquipmentType.Shield
//   ) {
//     chamberingAnimation = SkeletalAnimationName.MainHandUnarmedChambering;
//     deliveryAnimation = SkeletalAnimationName.MainHandUnarmedDelivery;
//     recoveryAnimation = SkeletalAnimationName.MainHandUnarmedRecovery;
//   } else {
//     // we need to see what type of damage we want to do to determine the correct animation
//     const { party } = context.combatantContext;
//     const { actionExecutionIntent } = context.tracker;

//     const targetingCalculator = new TargetingCalculator(context.combatantContext, null);
//     const action = COMBAT_ACTIONS[actionExecutionIntent.actionName];

//     const primaryTargetResult = targetingCalculator.getPrimaryTargetCombatant(
//       party,
//       actionExecutionIntent
//     );
//     if (primaryTargetResult instanceof Error) return primaryTargetResult;
//     const target = primaryTargetResult;

//     const targetIdsResult = targetingCalculator.getCombatActionTargetIds(
//       action,
//       actionExecutionIntent.targets
//     );
//     if (targetIdsResult instanceof Error) return targetIdsResult;
//     const targetIds = targetIdsResult;

//     const actionHpChangePropertiesOption = cloneDeep(
//       action.hitOutcomeProperties.getHpChangeProperties(
//         context.combatantContext.combatant.combatantProperties,
//         target.combatantProperties
//       )
//     );
//     const incomingResourceChangePerTargetOption = getIncomingResourceChangePerTarget(
//       targetIds,
//       actionHpChangePropertiesOption
//     );

//     if (incomingResourceChangePerTargetOption) {
//       const { kineticDamageTypeOption } =
//         incomingResourceChangePerTargetOption.resourceChangeSource;

//       if (kineticDamageTypeOption !== undefined)
//         switch (kineticDamageTypeOption) {
//           case KineticDamageType.Blunt:
//           case KineticDamageType.Slashing:
//             if (
//               mainhandEquipmentOption.equipmentBaseItemProperties.equipmentType ===
//               EquipmentType.TwoHandedMeleeWeapon
//             ) {
//               chamberingAnimation = SkeletalAnimationName.TwoHandSwingChambering;
//               deliveryAnimation = SkeletalAnimationName.TwoHandSwingDelivery;
//               recoveryAnimation = SkeletalAnimationName.TwoHandSwingRecovery;
//             }
//             break;
//           case KineticDamageType.Piercing:
//             if (
//               mainhandEquipmentOption.equipmentBaseItemProperties.equipmentType ===
//               EquipmentType.TwoHandedMeleeWeapon
//             ) {
//               chamberingAnimation = SkeletalAnimationName.TwoHandStabChambering;
//               deliveryAnimation = SkeletalAnimationName.TwoHandStabDelivery;
//               recoveryAnimation = SkeletalAnimationName.TwoHandStabRecovery;
//             } else {
//               chamberingAnimation = SkeletalAnimationName.MainHandStabChambering;
//               deliveryAnimation = SkeletalAnimationName.MainHandStabDelivery;
//               recoveryAnimation = SkeletalAnimationName.MainHandStabRecovery;
//             }
//         }
//     }
//   }

//   const animations: CombatActionCombatantAnimations = {
//     [CombatActionAnimationPhase.Initial]: {
//       name: { type: AnimationType.Skeletal, name: SkeletalAnimationName.MoveForwardLoop },
//       timing: { type: AnimationTimingType.Looping },
//     },
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
