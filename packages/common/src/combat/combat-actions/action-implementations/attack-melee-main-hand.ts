import {
  CombatActionComponentConfig,
  CombatActionLeaf,
  CombatActionName,
  CombatActionUsabilityContext,
  TargetCategories,
  TargetingScheme,
} from "../index.js";
import {
  BASE_CRIT_CHANCE,
  BASE_CRIT_MULTIPLIER,
  CRIT_ATTRIBUTE_TO_CRIT_CHANCE_RATIO,
  DEFAULT_COMBAT_ACTION_PERFORMANCE_TIME,
} from "../../../app-consts.js";
import { CombatantCondition } from "../../../combatants/combatant-conditions/index.js";
import { ProhibitedTargetCombatantStates } from "../prohibited-target-combatant-states.js";
import { AutoTargetingScheme, copyTargetFromParent } from "../../targeting/index.js";
import { ATTACK } from "./attack";
import { CombatActionHpChangeProperties } from "../combat-action-hp-change-properties.js";
import {
  HpChangeSource,
  HpChangeSourceCategory,
  HpChangeSourceConfig,
} from "../../hp-change-source-types.js";
import { CombatActionRequiredRange } from "../combat-action-range.js";
import { CombatantEquipment, CombatantProperties } from "../../../combatants/index.js";
import { CombatAttribute } from "../../../combatants/attributes/index.js";
import { ActionAccuracyType } from "../combat-action-accuracy.js";
import { iterateNumericEnum } from "../../../utils/index.js";
import { HoldableSlotType } from "../../../items/equipment/slots.js";
import { Equipment, EquipmentType } from "../../../items/equipment/index.js";
import { NumberRange } from "../../../primatives/number-range.js";
import { scaleRangeToActionLevel } from "../../action-results/hp-change-evasion-and-durability-change-result-calculation/scale-hp-range-to-action-level.js";
import { addCombatantLevelScaledAttributeToRange } from "../../action-results/hp-change-evasion-and-durability-change-result-calculation/add-combatant-level-scaled-attribute-to-range.js";

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
  getHpChangeProperties: (user) => {
    const hpChangeSourceConfig: HpChangeSourceConfig = {
      category: HpChangeSourceCategory.Physical,
      kineticDamageTypeOption: null,
      elementOption: null,
      isHealing: null,
      lifestealPercentage: null,
    };

    const baseValues = new NumberRange(1, 1);

    const actionLevel = user.level;
    const actionLevelScalingFactor = 1;
    // just get some extra damage for leveling up
    scaleRangeToActionLevel(baseValues, actionLevel, actionLevelScalingFactor);
    // get greater benefits from a certain attribute the higher level a combatant is
    addCombatantLevelScaledAttributeToRange({
      range: baseValues,
      combatantProperties: user,
      attribute: CombatAttribute.Strength,
      normalizedAttributeScalingByCombatantLevel: 1,
    });
    // @TODO - apply weapon damage and weapon hp change source modifiers
    const equippedUsableWeaponsResult = CombatantProperties.getUsableWeaponsInSlots(user, [
      HoldableSlotType.MainHand,
    ]);
    if (equippedUsableWeaponsResult instanceof Error) return equippedUsableWeaponsResult;
    const equippedUsableWeapons = equippedUsableWeaponsResult;

    //

    const hpChangeSource = new HpChangeSource(hpChangeSourceConfig);

    const hpChangeProperties: CombatActionHpChangeProperties = {
      hpChangeSource,
      baseValues,
    };

    // @TODO - handle these
    // finalDamagePercentMultiplier: 0,
    // addWeaponDamageFromSlots: null,
    // addWeaponModifiersFromSlot: null,
    // additiveAttributeAndPercentScalingFactor: null,
  },
  getAppliedConditions: function (): CombatantCondition[] | null {
    // ex: could make a "poison blade" item
    return null;
  },
  getAutoTarget(characterAssociatedData, combatAction) {
    // @TODO - change it to auto lookup the function based on this actions auto-targeting method
    return copyTargetFromParent(characterAssociatedData, combatAction);
  },
  getChildren: () => null,
  getParent: () => ATTACK,
};

export const ATTACK_MELEE_MAIN_HAND = new CombatActionLeaf(CombatActionName.Attack, config);
