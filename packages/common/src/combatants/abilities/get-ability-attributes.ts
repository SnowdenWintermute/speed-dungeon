import cloneDeep from "lodash.clonedeep";
import {
  CombatActionProperties,
  CombatActionHpChangeProperties,
  ActionUsableContext,
} from "../../combat/combat-actions/combat-action-properties.js";
import {
  OFF_HAND_ACCURACY_MODIFIER,
  OFF_HAND_CRIT_CHANCE_MODIFIER,
  OFF_HAND_DAMAGE_MODIFIER,
} from "../../app-consts.js";
import {
  HpChangeSource,
  HpChangeSourceCategory,
  HpChangeSourceModifiers,
  MeleeOrRanged,
} from "../../combat/hp-change-source-types.js";
import { MagicalElement } from "../../combat/magical-elements.js";
import { WeaponSlot } from "../../items/equipment/slots.js";
import { NumberRange } from "../../primatives/number-range.js";
import { CombatAttribute } from "../combat-attributes.js";
import AbilityAttributes from "./ability-attributes.js";
import { AbilityName } from "./ability-names.js";
import {
  TargetCategories,
  TargetingScheme,
} from "../../combat/combat-actions/targeting-schemes-and-categories.js";

const ATTACK = (() => {
  const combatActionProperties = new CombatActionProperties();
  combatActionProperties.description = "Use equipped weapon(s) or fists to strike the enemy.";
  const attributes = new AbilityAttributes(combatActionProperties);
  return attributes;
})();

const allWeaponModifiers = new Set<HpChangeSourceModifiers>([
  HpChangeSourceModifiers.KineticType,
  HpChangeSourceModifiers.MagicalElement,
  HpChangeSourceModifiers.SourceCategory,
]);

const ATTACK_MELEE_MAIN_HAND = (() => {
  const combatActionProperties = new CombatActionProperties();
  const hpChangeProperties = new CombatActionHpChangeProperties(
    new HpChangeSource(HpChangeSourceCategory.Physical, MeleeOrRanged.Melee)
  );
  hpChangeProperties.baseValues = new NumberRange(1, 1);
  hpChangeProperties.addWeaponDamageFromSlots = [WeaponSlot.MainHand];
  hpChangeProperties.addWeaponModifiersFromSlot = {
    slot: WeaponSlot.MainHand,
    modifiers: allWeaponModifiers,
  };
  hpChangeProperties.additiveAttributeAndPercentScalingFactor = [CombatAttribute.Strength, 100];
  hpChangeProperties.critChanceAttribute = CombatAttribute.Dexterity;
  hpChangeProperties.critMultiplierAttribute = CombatAttribute.Strength;

  combatActionProperties.hpChangeProperties = hpChangeProperties;
  const attributes = new AbilityAttributes(combatActionProperties);
  return attributes;
})();

const ATTACK_MELEE_OFF_HAND = (() => {
  const attributes = cloneDeep(ATTACK_MELEE_MAIN_HAND);
  const { hpChangeProperties } = attributes.combatActionProperties;
  attributes.combatActionProperties.accuracyPercentModifier = OFF_HAND_ACCURACY_MODIFIER;

  if (!hpChangeProperties) throw new Error("Expected ability not implemented");
  hpChangeProperties.addWeaponDamageFromSlots = [WeaponSlot.OffHand];
  hpChangeProperties.addWeaponModifiersFromSlot = {
    slot: WeaponSlot.OffHand,
    modifiers: allWeaponModifiers,
  };
  hpChangeProperties.additiveAttributeAndPercentScalingFactor = [CombatAttribute.Strength, 100];
  hpChangeProperties.critChanceAttribute = CombatAttribute.Dexterity;
  hpChangeProperties.critMultiplierAttribute = CombatAttribute.Strength;
  hpChangeProperties.critChanceModifier = OFF_HAND_CRIT_CHANCE_MODIFIER;
  hpChangeProperties.finalDamagePercentMultiplier = OFF_HAND_DAMAGE_MODIFIER;
  return attributes;
})();

const ATTACK_RANGED_MAIN_HAND = (() => {
  const attributes = cloneDeep(ATTACK_MELEE_MAIN_HAND);
  attributes.combatActionProperties.isMelee = false;
  const { hpChangeProperties } = attributes.combatActionProperties;
  if (!hpChangeProperties) throw new Error("Expected ability not implemented");
  hpChangeProperties.additiveAttributeAndPercentScalingFactor = [CombatAttribute.Dexterity, 100];
  hpChangeProperties.critChanceAttribute = CombatAttribute.Dexterity;
  hpChangeProperties.critMultiplierAttribute = CombatAttribute.Dexterity;
  hpChangeProperties.finalDamagePercentMultiplier = OFF_HAND_DAMAGE_MODIFIER;
  hpChangeProperties.hpChangeSource.meleeOrRanged = MeleeOrRanged.Ranged;
  return attributes;
})();

const FIRE = (() => {
  const combatActionProperties = new CombatActionProperties();
  combatActionProperties.description = "Deals fire element damage";
  combatActionProperties.isMelee = false;
  combatActionProperties.targetingSchemes = [TargetingScheme.Single, TargetingScheme.Area];

  const hpChangeProperties = new CombatActionHpChangeProperties(
    new HpChangeSource(HpChangeSourceCategory.Magical, MeleeOrRanged.Ranged)
  );
  hpChangeProperties.hpChangeSource.elementOption = MagicalElement.Fire;
  hpChangeProperties.hpChangeSource.unavoidable = true;
  combatActionProperties.hpChangeProperties = hpChangeProperties;

  const attributes = new AbilityAttributes(combatActionProperties);

  attributes.manaCost = 2;
  attributes.abilityLevelManaCostMultiplier = 1;
  attributes.combatantLevelManaCostMultiplier = 1;
  attributes.baseHpChangeValuesLevelMultiplier = 1.0;
  hpChangeProperties.baseValues = new NumberRange(4, 8);
  hpChangeProperties.additiveAttributeAndPercentScalingFactor = [CombatAttribute.Intelligence, 100];
  hpChangeProperties.critChanceAttribute = CombatAttribute.Focus;
  hpChangeProperties.critMultiplierAttribute = CombatAttribute.Focus;

  return attributes;
})();

const ICE = (() => {
  const attributes = cloneDeep(FIRE);
  const { hpChangeProperties } = attributes.combatActionProperties;
  if (!hpChangeProperties) throw new Error("Expected ability not implemented");
  attributes.combatActionProperties.description = "Deals ice element damage";
  hpChangeProperties.hpChangeSource.elementOption = MagicalElement.Ice;
  return attributes;
})();

const HEALING = (() => {
  const attributes = cloneDeep(FIRE);
  attributes.combatActionProperties.validTargetCategories = TargetCategories.Any;
  attributes.combatActionProperties.usabilityContext = ActionUsableContext.All;
  attributes.combatActionProperties.description = "Restores hit points to target (damages undead)";

  const { hpChangeProperties } = attributes.combatActionProperties;
  if (!hpChangeProperties) throw new Error("Expected ability not implemented");
  hpChangeProperties.hpChangeSource.elementOption = MagicalElement.Light;
  hpChangeProperties.hpChangeSource.isHealing = true;
  return attributes;
})();

const DESTRUCTION = (() => {
  const attributes = cloneDeep(FIRE);
  attributes.combatActionProperties.description = "For testing purposes";
  const { hpChangeProperties } = attributes.combatActionProperties;
  if (!hpChangeProperties) throw new Error("Expected ability not implemented");
  hpChangeProperties.hpChangeSource.elementOption = undefined;
  hpChangeProperties.baseValues = new NumberRange(99999, 99999);
  return attributes;
})();

export const ABILITY_ATTRIBUTES: Record<AbilityName, AbilityAttributes> = {
  [AbilityName.Attack]: ATTACK,
  [AbilityName.AttackMeleeMainhand]: ATTACK_MELEE_MAIN_HAND,
  [AbilityName.AttackMeleeOffhand]: ATTACK_MELEE_OFF_HAND,
  [AbilityName.AttackRangedMainhand]: ATTACK_RANGED_MAIN_HAND,
  [AbilityName.Fire]: FIRE,
  [AbilityName.Ice]: ICE,
  [AbilityName.Healing]: HEALING,
  [AbilityName.Destruction]: DESTRUCTION,
};
