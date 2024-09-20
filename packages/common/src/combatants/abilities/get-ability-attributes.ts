import { CombatantAbilityName } from "../index.js";
import { OFF_HAND_ACCURACY_MODIFIER, OFF_HAND_DAMAGE_MODIFIER } from "../../app_consts.js";
import {
  CombatActionProperties,
  ActionUsableContext,
  CombatActionHpChangeProperties,
} from "../../combat/combat-actions/combat-action-properties.js";
import {
  Evadable,
  HpChangeSourceCategoryType,
  MeleeOrRanged,
} from "../../combat/hp-change-source-types.js";
import { MagicalElement } from "../../combat/magical-elements.js";
import {
  ProhibitedTargetCombatantStates,
  TargetCategories,
  TargetingScheme,
} from "../../combat/targeting/index.js";
import { WeaponSlot } from "../../items/equipment/slots.js";
import { NumberRange } from "../../primatives/number-range.js";
import { CombatAttribute } from "../combat-attributes.js";
import CombatantAbilityAttributes from "./ability-attributes.js";

// @TODO - performance - store computed values from this function

export default function getAbilityAttributes(abilityName: CombatantAbilityName) {
  const attr = new CombatantAbilityAttributes();
  const cap = new CombatActionProperties();
  let hpcp: null | CombatActionHpChangeProperties = new CombatActionHpChangeProperties();
  switch (abilityName) {
    case CombatantAbilityName.Attack:
      attr.manaCost = 0;
      attr.isMelee = true;
      cap.description = "Use equipped weapon(s) or fists to strike the enemy.";
      hpcp = null;
      break;
    case CombatantAbilityName.AttackMeleeMainhand:
      attr.isMelee = true;
      attr.baseHpChangeValuesLevelMultiplier = 1.0;
      hpcp.baseValues = new NumberRange(1, 1);
      hpcp.addWeaponDamageFrom = [WeaponSlot.MainHand];
      hpcp.addWeaponElementFrom = WeaponSlot.MainHand;
      hpcp.addWeaponDamageTypeFrom = WeaponSlot.MainHand;
      hpcp.additiveAttributeAndPercentScalingFactor = [CombatAttribute.Strength, 100];
      hpcp.critChanceAttribute = CombatAttribute.Dexterity;
      hpcp.critMultiplierAttribute = CombatAttribute.Strength;
      hpcp.sourceProperties.category = {
        type: HpChangeSourceCategoryType.PhysicalDamage,
        meleeOrRanged: MeleeOrRanged.Melee,
      };
      break;
    case CombatantAbilityName.AttackMeleeOffhand:
      attr.isMelee = true;
      attr.baseHpChangeValuesLevelMultiplier = 1.0;
      hpcp.baseValues = new NumberRange(1, 1);
      hpcp.addWeaponDamageFrom = [WeaponSlot.OffHand];
      hpcp.addWeaponElementFrom = WeaponSlot.OffHand;
      hpcp.addWeaponDamageTypeFrom = WeaponSlot.OffHand;
      hpcp.additiveAttributeAndPercentScalingFactor = [CombatAttribute.Strength, 100];
      hpcp.critChanceAttribute = CombatAttribute.Dexterity;
      hpcp.critMultiplierAttribute = CombatAttribute.Strength;
      hpcp.finalDamagePercentMultiplier = OFF_HAND_DAMAGE_MODIFIER;
      hpcp.accuracyPercentModifier = OFF_HAND_ACCURACY_MODIFIER;
      hpcp.sourceProperties.category = {
        type: HpChangeSourceCategoryType.PhysicalDamage,
        meleeOrRanged: MeleeOrRanged.Melee,
      };
      break;
    case CombatantAbilityName.AttackRangedMainhand:
      attr.isMelee = false;
      attr.baseHpChangeValuesLevelMultiplier = 1.0;
      hpcp.baseValues = new NumberRange(1, 1);
      hpcp.addWeaponDamageFrom = [WeaponSlot.MainHand];
      hpcp.addWeaponElementFrom = WeaponSlot.MainHand;
      hpcp.addWeaponDamageTypeFrom = WeaponSlot.MainHand;
      hpcp.additiveAttributeAndPercentScalingFactor = [CombatAttribute.Dexterity, 100];
      hpcp.critChanceAttribute = CombatAttribute.Dexterity;
      hpcp.critMultiplierAttribute = CombatAttribute.Dexterity;
      hpcp.sourceProperties.category = {
        type: HpChangeSourceCategoryType.PhysicalDamage,
        meleeOrRanged: MeleeOrRanged.Ranged,
      };
      break;
    case CombatantAbilityName.Fire:
      attr.manaCost = 2;
      attr.abilityLevelManaCostMultiplier = 1;
      attr.combatantLevelManaCostMultiplier = 1;
      attr.baseHpChangeValuesLevelMultiplier = 1.0;
      cap.description = "Deals fire element damage";
      cap.targetingSchemes = [TargetingScheme.Single, TargetingScheme.Area];
      hpcp.baseValues = new NumberRange(4, 8);
      hpcp.additiveAttributeAndPercentScalingFactor = [CombatAttribute.Intelligence, 100];
      hpcp.critChanceAttribute = CombatAttribute.Focus;
      hpcp.critMultiplierAttribute = CombatAttribute.Focus;
      hpcp.sourceProperties.category = {
        type: HpChangeSourceCategoryType.MagicalDamage,
        evadable: Evadable.False,
      };
      hpcp.sourceProperties.elementOption = MagicalElement.Fire;
      break;
    case CombatantAbilityName.Ice:
      attr.manaCost = 2;
      attr.abilityLevelManaCostMultiplier = 1;
      attr.combatantLevelManaCostMultiplier = 1;
      attr.baseHpChangeValuesLevelMultiplier = 1.0;
      cap.description = "Deals ice element damage";
      cap.targetingSchemes = [TargetingScheme.Single, TargetingScheme.Area];
      hpcp.baseValues = new NumberRange(4, 8);
      hpcp.additiveAttributeAndPercentScalingFactor = [CombatAttribute.Intelligence, 100];
      hpcp.critChanceAttribute = CombatAttribute.Focus;
      hpcp.critMultiplierAttribute = CombatAttribute.Focus;
      hpcp.sourceProperties.category = {
        type: HpChangeSourceCategoryType.MagicalDamage,
        evadable: Evadable.False,
      };
      hpcp.sourceProperties.elementOption = MagicalElement.Ice;
      break;
    case CombatantAbilityName.Healing:
      attr.manaCost = 2;
      attr.abilityLevelManaCostMultiplier = 1;
      attr.combatantLevelManaCostMultiplier = 1;
      attr.baseHpChangeValuesLevelMultiplier = 1.0;
      cap.description = "Deals ice element damage";
      cap.targetingSchemes = [TargetingScheme.Single, TargetingScheme.Area];
      cap.validTargetCategories = TargetCategories.Any;
      cap.usabilityContext = ActionUsableContext.All;
      cap.prohibitedTargetCombatantStates = [ProhibitedTargetCombatantStates.Dead];
      hpcp.baseValues = new NumberRange(6, 12);
      hpcp.additiveAttributeAndPercentScalingFactor = [CombatAttribute.Intelligence, 100];
      hpcp.critChanceAttribute = CombatAttribute.Focus;
      hpcp.critMultiplierAttribute = CombatAttribute.Focus;
      hpcp.sourceProperties.category = {
        type: HpChangeSourceCategoryType.Healing,
      };
      hpcp.sourceProperties.elementOption = MagicalElement.Light;
      break;
  }
  cap.hpChangeProperties = hpcp;
  attr.combatActionProperties = cap;
  return attr;
}
