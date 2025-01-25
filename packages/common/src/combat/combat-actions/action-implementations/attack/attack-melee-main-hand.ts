import {
  CombatActionComponentConfig,
  CombatActionLeaf,
  CombatActionName,
  CombatActionUsabilityContext,
  TargetCategories,
  TargetingScheme,
} from "../../index.js";
import { DEFAULT_COMBAT_ACTION_PERFORMANCE_TIME } from "../../../../app-consts.js";
import { CombatantCondition } from "../../../../combatants/combatant-conditions/index.js";
import { ProhibitedTargetCombatantStates } from "../../prohibited-target-combatant-states.js";
import { AutoTargetingScheme } from "../../../targeting/index.js";
import { ATTACK } from "./index.js";
import { CombatActionRequiredRange } from "../../combat-action-range.js";
import { CombatantEquipment, CombatantProperties } from "../../../../combatants/index.js";
import { CombatAttribute } from "../../../../combatants/attributes/index.js";
import { ActionAccuracyType } from "../../combat-action-accuracy.js";
import { iterateNumericEnum } from "../../../../utils/index.js";
import { EquipmentSlotType, HoldableSlotType } from "../../../../items/equipment/slots.js";
import { Equipment, EquipmentType } from "../../../../items/equipment/index.js";
import { getAttackHpChangeProperties } from "./get-attack-hp-change-properties.js";
import {
  getStandardActionCritChance,
  getStandardActionCritMultiplier,
} from "../../action-calculation-utils/standard-action-calculations.js";

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
  accuracyModifier: 1,
  appliesConditions: [],
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
  getAnimationsAndEffects: function (): void {
    // @TODO
    // combatant move self into melee range
    // animate combatant (swing main hand) (later can animate specific swings based on equipped weapon)
    throw new Error("Function not implemented.");
  },
  getRequiredRange: () => CombatActionRequiredRange.Melee,
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
    return getStandardActionCritMultiplier(user, CombatAttribute.Strength);
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

export const ATTACK_MELEE_MAIN_HAND = new CombatActionLeaf(
  CombatActionName.AttackMeleeMainhand,
  config
);
