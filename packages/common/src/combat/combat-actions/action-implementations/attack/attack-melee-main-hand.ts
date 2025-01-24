import {
  CombatActionComponentConfig,
  CombatActionLeaf,
  CombatActionName,
  CombatActionUsabilityContext,
  TargetCategories,
  TargetingScheme,
} from "../../index.js";
import {
  BASE_CRIT_CHANCE,
  BASE_CRIT_MULTIPLIER,
  CRIT_ATTRIBUTE_TO_CRIT_CHANCE_RATIO,
  DEFAULT_COMBAT_ACTION_PERFORMANCE_TIME,
} from "../../../../app-consts.js";
import { CombatantCondition } from "../../../../combatants/combatant-conditions/index.js";
import { ProhibitedTargetCombatantStates } from "../../prohibited-target-combatant-states.js";
import { AutoTargetingScheme } from "../../../targeting/index.js";
import { ATTACK } from "./index.js";
import { CombatActionRequiredRange } from "../../combat-action-range.js";
import { CombatantEquipment, CombatantProperties } from "../../../../combatants/index.js";
import { CombatAttribute } from "../../../../combatants/attributes/index.js";
import { ActionAccuracyType } from "../../combat-action-accuracy.js";
import { iterateNumericEnum } from "../../../../utils/index.js";
import { HoldableSlotType } from "../../../../items/equipment/slots.js";
import { Equipment, EquipmentType } from "../../../../items/equipment/index.js";
import { getAttackHpChangeProperties } from "./get-attack-hp-change-properties.js";

const config: CombatActionComponentConfig = {
  description: "Attack target using equipment in main hand",
  targetingSchemes: [TargetingScheme.Single],
  validTargetCategories: TargetCategories.Opponent,
  autoTargetSelectionMethod: { scheme: AutoTargetingScheme.CopyParent },
  usabilityContext: CombatActionUsabilityContext.InCombat,
  prohibitedTargetCombatantStates: [
    ProhibitedTargetCombatantStates.Dead,
    ProhibitedTargetCombatantStates.UntargetableByPhysical,
  ],
  baseHpChangeValuesLevelMultiplier: 1,
  accuracyPercentModifier: 100,
  appliesConditions: [],
  incursDurabilityLoss: {},
  costs: null,
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
  getAnimationsAndEffects: function (): void {
    // @TODO
    // combatant move self into melee range
    // animate combatant (swing main hand) (later can animate specific swings based on equipped weapon)
    throw new Error("Function not implemented.");
  },
  getRequiredRange: () => CombatActionRequiredRange.Melee,
  getAccuracy: (user) => {
    const userCombatAttributes = CombatantProperties.getTotalAttributes(user);
    return {
      type: ActionAccuracyType.NormalizedPercentage,
      value: userCombatAttributes[CombatAttribute.Accuracy],
    };
  },
  getCritChance: (user) => {
    const critChanceAttribute = CombatAttribute.Dexterity;
    if (critChanceAttribute === null) return BASE_CRIT_CHANCE;
    const userAttributes = CombatantProperties.getTotalAttributes(user);
    const userCritChanceAttributeValue =
      userAttributes[critChanceAttribute] * CRIT_ATTRIBUTE_TO_CRIT_CHANCE_RATIO;
    return userCritChanceAttributeValue + BASE_CRIT_CHANCE;
  },
  getCritMultiplier(user) {
    let critMultiplier = BASE_CRIT_MULTIPLIER;
    const critMultiplierAttribute = CombatAttribute.Strength;
    const userAttributes = CombatantProperties.getTotalAttributes(user);
    const multiplierAttribute = userAttributes[critMultiplierAttribute] || 0;
    return critMultiplier + multiplierAttribute / 100;
  },
  getHpChangeProperties: (user, primaryTarget) => {
    const hpChangeProperties = getAttackHpChangeProperties(
      user,
      primaryTarget,
      CombatAttribute.Strength,
      HoldableSlotType.MainHand
    );
    // @TODO - if any final modifies like for offhand, do it here
    return hpChangeProperties;
  },
  getAppliedConditions: function (): CombatantCondition[] | null {
    return null; // ex: could make a "poison blade" item
  },
  getChildren: () => null,
  getParent: () => ATTACK,
};

export const ATTACK_MELEE_MAIN_HAND = new CombatActionLeaf(CombatActionName.Attack, config);
