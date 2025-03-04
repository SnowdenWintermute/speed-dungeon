import {
  CombatActionComponentConfig,
  CombatActionLeaf,
  CombatActionName,
  CombatActionUsabilityContext,
  TargetCategories,
  TargetingScheme,
} from "../../index.js";
import { AnimationName, DEFAULT_COMBAT_ACTION_PERFORMANCE_TIME } from "../../../../app-consts.js";
import { CombatantCondition } from "../../../../combatants/combatant-conditions/index.js";
import { ProhibitedTargetCombatantStates } from "../../prohibited-target-combatant-states.js";
import { ATTACK } from "./index.js";
import { CombatantEquipment } from "../../../../combatants/index.js";
import { CombatAttribute } from "../../../../combatants/attributes/index.js";
import { iterateNumericEnum } from "../../../../utils/index.js";
import { EquipmentSlotType, HoldableSlotType } from "../../../../items/equipment/slots.js";
import { Equipment, EquipmentType } from "../../../../items/equipment/index.js";
import { getAttackHpChangeProperties } from "./get-attack-hp-change-properties.js";
import { CombatActionIntent } from "../../combat-action-intent.js";
import { AutoTargetingScheme } from "../../../targeting/auto-targeting/index.js";
import { MELEE_ATTACK_COMMON_CONFIG } from "../melee-actions-common-config.js";
import { CombatantContext } from "../../../../combatant-context/index.js";
import {
  CombatActionAnimationPhase,
  CombatActionCombatantAnimations,
} from "../../combat-action-animations.js";
import { AnimationTimingType } from "../../../../action-processing/index.js";

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
  baseHpChangeValuesLevelMultiplier: 1,
  accuracyModifier: 1,
  incursDurabilityLoss: { [EquipmentSlotType.Holdable]: { [HoldableSlotType.MainHand]: 1 } },
  costBases: {},
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
  getCombatantUseAnimations: (combatantContext: CombatantContext) => {
    const animations: CombatActionCombatantAnimations = {
      [CombatActionAnimationPhase.Initial]: {
        name: AnimationName.MoveForward,
        timing: { type: AnimationTimingType.Looping },
      },
      [CombatActionAnimationPhase.Chambering]: null,
      [CombatActionAnimationPhase.Delivery]: {
        name: AnimationName.MeleeMainHandDelivery,
        timing: { type: AnimationTimingType.Timed, duration: 1200 },
      },
      [CombatActionAnimationPhase.RecoverySuccess]: {
        name: AnimationName.MeleeMainHandRecoverySuccess,
        timing: { type: AnimationTimingType.Timed, duration: 700 },
      },
      [CombatActionAnimationPhase.RecoveryInterrupted]: {
        name: AnimationName.MeleeMainHandRecoveryInterrupted,
        timing: { type: AnimationTimingType.Timed, duration: 700 },
      },
      [CombatActionAnimationPhase.Final]: {
        name: AnimationName.MoveBack,
        timing: { type: AnimationTimingType.Looping },
      },
    };
    return animations;
  },
  getHpChangeProperties: (user, primaryTarget, self) => {
    const hpChangeProperties = getAttackHpChangeProperties(
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
