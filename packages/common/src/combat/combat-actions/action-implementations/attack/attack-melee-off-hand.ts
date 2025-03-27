import {
  CombatActionComponent,
  CombatActionComponentConfig,
  CombatActionLeaf,
  CombatActionName,
  CombatActionUsabilityContext,
  TargetCategories,
  TargetingScheme,
} from "../../index.js";
import {
  AnimationType,
  SkeletalAnimationName,
  DEFAULT_COMBAT_ACTION_PERFORMANCE_TIME,
  OFF_HAND_ACCURACY_MODIFIER,
  OFF_HAND_CRIT_CHANCE_MODIFIER,
  OFF_HAND_DAMAGE_MODIFIER,
} from "../../../../app-consts.js";
import { CombatantCondition } from "../../../../combatants/combatant-conditions/index.js";
import { ProhibitedTargetCombatantStates } from "../../prohibited-target-combatant-states.js";
import { ATTACK } from "./index.js";
import { CombatantEquipment, CombatantProperties } from "../../../../combatants/index.js";
import { CombatAttribute } from "../../../../combatants/attributes/index.js";
import { iterateNumericEnum } from "../../../../utils/index.js";
import { EquipmentSlotType, HoldableSlotType } from "../../../../items/equipment/slots.js";
import { Equipment, EquipmentType } from "../../../../items/equipment/index.js";
import { getAttackHpChangeProperties } from "./get-attack-hp-change-properties.js";
import { SpeedDungeonGame } from "../../../../game/index.js";
import { CombatActionIntent } from "../../combat-action-intent.js";
import { AutoTargetingScheme } from "../../../targeting/auto-targeting/index.js";
import { getStandardActionCritChance } from "../../action-calculation-utils/standard-action-calculations.js";
import { TargetingCalculator } from "../../../targeting/targeting-calculator.js";
import { CombatantContext } from "../../../../combatant-context/index.js";
import { MELEE_ATTACK_COMMON_CONFIG } from "../melee-actions-common-config.js";
import {
  CombatActionAnimationPhase,
  CombatActionCombatantAnimations,
} from "../../combat-action-animations.js";
import { AnimationTimingType } from "../../../../action-processing/game-update-commands.js";
import { ActionResolutionStepContext } from "../../../../action-processing/index.js";
import { HpChangeSourceCategory } from "../../../hp-change-source-types.js";
import { KineticDamageType } from "../../../kinetic-damage-types.js";

const config: CombatActionComponentConfig = {
  ...MELEE_ATTACK_COMMON_CONFIG,
  description: "Attack target using equipment in off hand",
  targetingSchemes: [TargetingScheme.Single],
  validTargetCategories: TargetCategories.Opponent,
  autoTargetSelectionMethod: { scheme: AutoTargetingScheme.CopyParent },
  intent: CombatActionIntent.Malicious,
  usabilityContext: CombatActionUsabilityContext.InCombat,
  prohibitedTargetCombatantStates: [
    ProhibitedTargetCombatantStates.Dead,
    ProhibitedTargetCombatantStates.UntargetableByPhysical,
  ],
  baseHpChangeValuesLevelMultiplier: 1,
  accuracyModifier: OFF_HAND_ACCURACY_MODIFIER,
  incursDurabilityLoss: { [EquipmentSlotType.Holdable]: { [HoldableSlotType.OffHand]: 1 } },
  costBases: {},
  // getDestinationDuringDelivery: (
  //   combatantContext: CombatantContext,
  //   actionExecutionIntent: CombatActionExecutionIntent,
  //   self: CombatActionComponent
  // ) => {
  //   return combatantContext.combatant.combatantProperties.position.clone();
  // },
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
  shouldExecute: (combatantContext, self: CombatActionComponent) => {
    const { game, party, combatant } = combatantContext;

    const targetsOption = combatant.combatantProperties.combatActionTarget;
    if (!targetsOption) return false;

    const targetingCalculator = new TargetingCalculator(
      new CombatantContext(game, party, combatant),
      null
    );

    const targetIdsResult = targetingCalculator.getCombatActionTargetIds(self, targetsOption);
    if (targetIdsResult instanceof Error) {
      console.trace(targetIdsResult);
      return false;
    }

    return !SpeedDungeonGame.allCombatantsInGroupAreDead(game, targetIdsResult);
  },
  getActionStepAnimations: (context) => {
    let chamberingAnimation = SkeletalAnimationName.OffHandSwingChambering;
    let deliveryAnimation = SkeletalAnimationName.OffHandSwingDelivery;
    let recoveryAnimation = SkeletalAnimationName.OffHandSwingRecovery;

    const { combatantProperties } = context.combatantContext.combatant;

    const offhandEquipmentOption = CombatantEquipment.getEquippedHoldable(
      combatantProperties,
      HoldableSlotType.OffHand
    );

    if (
      !offhandEquipmentOption ||
      offhandEquipmentOption.equipmentBaseItemProperties.equipmentType === EquipmentType.Shield
    ) {
      chamberingAnimation = SkeletalAnimationName.OffHandUnarmedChambering;
      deliveryAnimation = SkeletalAnimationName.OffHandUnarmedDelivery;
      recoveryAnimation = SkeletalAnimationName.OffHandUnarmedRecovery;
      console.log("set animations for unarmed offhand");
    } else {
      const { tracker } = context;
      const { hitPointChanges } = tracker.hitOutcomes;
      if (hitPointChanges) {
        for (const [_, hpChange] of hitPointChanges.getRecords()) {
          const { kineticDamageTypeOption } = hpChange.source;
          if (kineticDamageTypeOption !== undefined)
            switch (kineticDamageTypeOption) {
              case KineticDamageType.Blunt:
              case KineticDamageType.Slashing:
                break;
              case KineticDamageType.Piercing:
                chamberingAnimation = SkeletalAnimationName.OffHandStabChambering;
                deliveryAnimation = SkeletalAnimationName.OffHandStabDelivery;
                recoveryAnimation = SkeletalAnimationName.OffHandStabRecovery;
            }
        }
      }
    }

    const animations: CombatActionCombatantAnimations = {
      [CombatActionAnimationPhase.Initial]: {
        name: { type: AnimationType.Skeletal, name: SkeletalAnimationName.MoveForwardLoop },
        timing: { type: AnimationTimingType.Looping },
      },
      [CombatActionAnimationPhase.Chambering]: {
        name: { type: AnimationType.Skeletal, name: chamberingAnimation },
        timing: { type: AnimationTimingType.Timed, duration: 300 },
      },
      [CombatActionAnimationPhase.Delivery]: {
        name: { type: AnimationType.Skeletal, name: deliveryAnimation },
        timing: { type: AnimationTimingType.Timed, duration: 1200 },
      },
      [CombatActionAnimationPhase.RecoverySuccess]: {
        name: {
          type: AnimationType.Skeletal,
          name: recoveryAnimation,
        },
        timing: { type: AnimationTimingType.Timed, duration: 700 },
      },
      [CombatActionAnimationPhase.RecoveryInterrupted]: {
        name: {
          type: AnimationType.Skeletal,
          name: recoveryAnimation,
        },
        timing: { type: AnimationTimingType.Timed, duration: 700 },
      },
      [CombatActionAnimationPhase.Final]: {
        name: { type: AnimationType.Skeletal, name: SkeletalAnimationName.MoveBack },
        timing: { type: AnimationTimingType.Looping },
      },
    };
    return animations;
  },
  getCritChance: function (user: CombatantProperties): number {
    return (
      getStandardActionCritChance(user, CombatAttribute.Dexterity) * OFF_HAND_CRIT_CHANCE_MODIFIER
    );
  },
  getHpChangeProperties: (user, primaryTarget, self) => {
    const hpChangeProperties = getAttackHpChangeProperties(
      self,
      user,
      primaryTarget,
      CombatAttribute.Strength,
      HoldableSlotType.MainHand
    );
    if (hpChangeProperties instanceof Error) return hpChangeProperties;

    hpChangeProperties.baseValues.mult(OFF_HAND_DAMAGE_MODIFIER);
    return hpChangeProperties;
  },
  getAppliedConditions: function (): CombatantCondition[] | null {
    return null; // ex: could make a "poison blade" item
  },
  getChildren: () => [],
  getParent: () => ATTACK,
};

export const ATTACK_MELEE_OFF_HAND = new CombatActionLeaf(
  CombatActionName.AttackMeleeOffhand,
  config
);
