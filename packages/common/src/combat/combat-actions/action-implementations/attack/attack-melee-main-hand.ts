import {
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
import { ATTACK } from "./index.js";
import { CombatantEquipment } from "../../../../combatants/index.js";
import { CombatAttribute } from "../../../../combatants/attributes/index.js";
import { iterateNumericEnum } from "../../../../utils/index.js";
import { EquipmentSlotType, HoldableSlotType } from "../../../../items/equipment/slots.js";
import { Equipment, EquipmentType } from "../../../../items/equipment/index.js";
import { getAttackResourceChangeProperties } from "./get-attack-hp-change-properties.js";
import { CombatActionIntent } from "../../combat-action-intent.js";
import { AutoTargetingScheme } from "../../../targeting/auto-targeting/index.js";
import { MELEE_ATTACK_COMMON_CONFIG } from "../melee-actions-common-config.js";
import {
  CombatActionAnimationPhase,
  CombatActionCombatantAnimations,
  getFallbackAnimationWithLength,
} from "../../combat-action-animations.js";
import { AnimationTimingType } from "../../../../action-processing/index.js";
import { KineticDamageType } from "../../../kinetic-damage-types.js";
import { TargetingCalculator } from "../../../targeting/targeting-calculator.js";
import { DurabilityLossCondition } from "../../combat-action-durability-loss-condition.js";
import { getIncomingResourceChangePerTarget } from "../../../action-results/index.js";
import cloneDeep from "lodash.clonedeep";
import { COMBAT_ACTIONS } from "../index.js";

const config: CombatActionComponentConfig = {
  ...MELEE_ATTACK_COMMON_CONFIG,
  description: "Attack target using equipment in main hand",
  targetingSchemes: [TargetingScheme.Single],
  validTargetCategories: TargetCategories.Opponent,
  autoTargetSelectionMethod: { scheme: AutoTargetingScheme.CopyParent },
  usabilityContext: CombatActionUsabilityContext.InCombat,
  intent: CombatActionIntent.Malicious,
  prohibitedTargetCombatantStates: [
    ProhibitedTargetCombatantStates.Dead,
    ProhibitedTargetCombatantStates.UntargetableByPhysical,
  ],
  prohibitedHitCombatantStates: [],
  accuracyModifier: 1,
  incursDurabilityLoss: {
    [EquipmentSlotType.Holdable]: { [HoldableSlotType.MainHand]: DurabilityLossCondition.OnHit },
  },
  costBases: {},
  getResourceCosts: () => null,
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
  shouldExecute: () => true,
  getActionStepAnimations: (context) => {
    let chamberingAnimation = SkeletalAnimationName.MainHandSwingChambering;
    let deliveryAnimation = SkeletalAnimationName.MainHandSwingDelivery;
    let recoveryAnimation = SkeletalAnimationName.MainHandSwingRecovery;

    const { animationLengths } = context.manager.sequentialActionManagerRegistry;
    const speciesLengths =
      animationLengths[context.combatantContext.combatant.combatantProperties.combatantSpecies];

    const { combatantProperties } = context.combatantContext.combatant;

    const mainhandEquipmentOption = CombatantEquipment.getEquippedHoldable(
      combatantProperties,
      HoldableSlotType.MainHand
    );

    if (
      !mainhandEquipmentOption ||
      Equipment.isBroken(mainhandEquipmentOption) ||
      mainhandEquipmentOption.equipmentBaseItemProperties.equipmentType === EquipmentType.Shield
    ) {
      chamberingAnimation = SkeletalAnimationName.MainHandUnarmedChambering;
      deliveryAnimation = SkeletalAnimationName.MainHandUnarmedDelivery;
      recoveryAnimation = SkeletalAnimationName.MainHandUnarmedRecovery;
    } else {
      // we need to see what type of damage we want to do to determine the correct animation
      const { party } = context.combatantContext;
      const { actionExecutionIntent } = context.tracker;

      const targetingCalculator = new TargetingCalculator(context.combatantContext, null);
      const action = COMBAT_ACTIONS[actionExecutionIntent.actionName];

      const primaryTargetResult = targetingCalculator.getPrimaryTargetCombatant(
        party,
        actionExecutionIntent
      );
      if (primaryTargetResult instanceof Error) return primaryTargetResult;
      const target = primaryTargetResult;

      const targetIdsResult = targetingCalculator.getCombatActionTargetIds(
        action,
        actionExecutionIntent.targets
      );
      if (targetIdsResult instanceof Error) return targetIdsResult;
      const targetIds = targetIdsResult;

      const actionHpChangePropertiesOption = cloneDeep(
        action.getHpChangeProperties(
          context.combatantContext.combatant.combatantProperties,
          target.combatantProperties
        )
      );
      const incomingResourceChangePerTargetOption = getIncomingResourceChangePerTarget(
        targetIds,
        actionHpChangePropertiesOption
      );

      if (incomingResourceChangePerTargetOption) {
        const { kineticDamageTypeOption } =
          incomingResourceChangePerTargetOption.resourceChangeSource;

        if (kineticDamageTypeOption !== undefined)
          switch (kineticDamageTypeOption) {
            case KineticDamageType.Blunt:
            case KineticDamageType.Slashing:
              if (
                mainhandEquipmentOption.equipmentBaseItemProperties.equipmentType ===
                EquipmentType.TwoHandedMeleeWeapon
              ) {
                chamberingAnimation = SkeletalAnimationName.TwoHandSwingChambering;
                deliveryAnimation = SkeletalAnimationName.TwoHandSwingDelivery;
                recoveryAnimation = SkeletalAnimationName.TwoHandSwingRecovery;
              }
              break;
            case KineticDamageType.Piercing:
              if (
                mainhandEquipmentOption.equipmentBaseItemProperties.equipmentType ===
                EquipmentType.TwoHandedMeleeWeapon
              ) {
                chamberingAnimation = SkeletalAnimationName.TwoHandStabChambering;
                deliveryAnimation = SkeletalAnimationName.TwoHandStabDelivery;
                recoveryAnimation = SkeletalAnimationName.TwoHandStabRecovery;
              } else {
                chamberingAnimation = SkeletalAnimationName.MainHandStabChambering;
                deliveryAnimation = SkeletalAnimationName.MainHandStabDelivery;
                recoveryAnimation = SkeletalAnimationName.MainHandStabRecovery;
              }
          }
      }
    }

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
    const hpChangeProperties = getAttackResourceChangeProperties(
      self,
      user,
      primaryTarget,
      CombatAttribute.Strength,
      HoldableSlotType.MainHand
    );

    return hpChangeProperties;
  },
  getAppliedConditions: function (): CombatantCondition[] | null {
    return null; // ex: could make a "poison blade" item
  },
  getChildren: () => [],
  getParent: () => ATTACK,
};

export const ATTACK_MELEE_MAIN_HAND = new CombatActionLeaf(
  CombatActionName.AttackMeleeMainhand,
  config
);
