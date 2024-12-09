import {
  DERIVED_ATTRIBUTE_RATIOS,
  RESILIENCE_TO_PERCENT_MAGICAL_DAMAGE_REDUCTION_RATIO,
  RESILIENCE_TO_PERCENT_MAGICAL_HEALING_INCREASE_RATIO,
} from "../app-consts.js";

export enum CombatAttribute {
  // DERIVED
  // offensive
  Damage, // adds a flat bonus to physical damage
  ArmorPenetration, // subtracted from target's armor class
  Accuracy, // after target's evasion subtracted, the chance for an evadable actions to
  // hit its target
  // defensive
  ArmorClass, // compared with final damage of physical attack, reduces damage on a curve
  Evasion, // reduces the chance to be hit by evadable actions
  Hp, // if 0 or below, a combatant can no longer take actions
  // utility
  Speed, // determines turn order
  Mp, // a resource for ability use
  // MAIN
  // offensive
  Strength, // damage with melee attacks, melee crit multiplier, melee armor pen, shield block
  // chance
  Dexterity, // ranged damage, accuracy, physical crit chance, armor ranged armor pen, shield
  // block chance
  Intelligence, // mp, magic ability damage
  Focus, // negates %magic reduction and increases spell crit chance and crit multiplier
  // defensive
  Vitality, // hp, and debuff duration, shield block damage reduction
  Resilience, // %magic damage reduction, healing received, debuff duration
  Agility, // movement speed, evasion, physical crit chance reduction
}

export const CORE_ATTRIBUTES = [
  CombatAttribute.Dexterity,
  CombatAttribute.Intelligence,
  CombatAttribute.Strength,
  CombatAttribute.Vitality,
];

export const ATTRIBUTE_POINT_ASSIGNABLE_ATTRIBUTES = [
  CombatAttribute.Dexterity,
  CombatAttribute.Intelligence,
  CombatAttribute.Strength,
  CombatAttribute.Vitality,
  CombatAttribute.Resilience,
  CombatAttribute.Focus,
  CombatAttribute.Agility,
];

export function formatCombatAttribute(attribute: CombatAttribute) {
  switch (attribute) {
    case CombatAttribute.Damage:
      return "Damage";
    case CombatAttribute.ArmorClass:
      return "Armor Class";
    case CombatAttribute.Dexterity:
      return "Dexterity";
    case CombatAttribute.Strength:
      return "Strength";
    case CombatAttribute.Intelligence:
      return "Intelligence";
    case CombatAttribute.Vitality:
      return "Vitality";
    case CombatAttribute.Resilience:
      return "Resilience";
    case CombatAttribute.Agility:
      return "Agility";
    case CombatAttribute.Accuracy:
      return "Accuracy";
    case CombatAttribute.Focus:
      return "Focus";
    case CombatAttribute.Evasion:
      return "Evasion";
    case CombatAttribute.Speed:
      return "Speed";
    case CombatAttribute.Hp:
      return "HP";
    case CombatAttribute.Mp:
      return "MP";
    case CombatAttribute.ArmorPenetration:
      return "Armor Pen.";
  }
}

export function getCombatAttributeDescription(attribute: CombatAttribute) {
  switch (attribute) {
    case CombatAttribute.Damage:
      return "A flat bonus applied to physical attacks";
    case CombatAttribute.ArmorPenetration:
      return "Negates a target's armor class";
    case CombatAttribute.Accuracy:
      return "Chance to hit a target with an evadable attack. Targets that wish to evade will subtract their evasion from this number.";
    case CombatAttribute.ArmorClass:
      return "Reduces physical damage";
    case CombatAttribute.Evasion:
      return "Chance to avoid being hit";
    case CombatAttribute.Hp:
      return "If reduced to zero the combatant can no longer take actions";
    case CombatAttribute.Speed:
      return "Determines turn order";
    case CombatAttribute.Mp:
      return "The primary resource for using abilities";
    case CombatAttribute.Focus:
      return "Negates target magic defense and increases crit chance and crit multiplier for magical effects";
    case CombatAttribute.Dexterity:
      return "Increases accuracy, crit chance with physical attacks, ranged attack damage and ranged attack armor penetration";
    case CombatAttribute.Intelligence:
      return "Increases mana and spell damage";
    case CombatAttribute.Strength:
      return "Increases attack damage, crit multiplier and armor penetration for melee attacks";
    case CombatAttribute.Vitality:
      return "Increases hit points";
    case CombatAttribute.Resilience:
      return `Reduces magical damage by ${RESILIENCE_TO_PERCENT_MAGICAL_DAMAGE_REDUCTION_RATIO}%, increases healing received from magical sources by ${RESILIENCE_TO_PERCENT_MAGICAL_HEALING_INCREASE_RATIO}% and reduces the chance of unwanted critical strikes by 1% per point`;
    case CombatAttribute.Agility:
      return `Increases evasion and speed`;
  }
}
