import {
  RESILIENCE_TO_PERCENT_MAGICAL_DAMAGE_REDUCTION_RATIO,
  RESILIENCE_TO_PERCENT_MAGICAL_HEALING_INCREASE_RATIO,
} from "../../app-consts.js";

// parry chance
// shield block chance
// shield block damage reduction
// spell crit
// spell crit multiplier

export enum CombatAttribute {
  Strength, // damage with melee attacks, melee crit multiplier, melee armor pen
  Dexterity, // ranged damage, accuracy, physical crit chance, armor ranged armor pen
  Intelligence, // mp, magic ability damage
  Vitality, // hp, and debuff duration
  Resilience, // %magic damage reduction, healing received, debuff duration

  Focus, // negates %magic reduction and increases spell crit chance and crit multiplier

  Agility, // movement speed, evasion, physical crit chance reduction

  Speed, // determines turn order
  ArmorClass, // compared with final damage of physical attack, reduces damage on a curve
  ArmorPenetration, // subtracted from target's armor class
  Accuracy, // after target's evasion subtracted, the chance for an evadable actions to hit its target
  Evasion, // reduces the chance to be hit by evadable actions

  Hp, // if 0 or below, a combatant can no longer take actions
  Mp, // a resource for ability use
}

export const CORE_ATTRIBUTES = [
  CombatAttribute.Dexterity,
  CombatAttribute.Intelligence,
  CombatAttribute.Strength,
  CombatAttribute.Vitality,
];

export const ATTRIBUTE_POINT_ASSIGNABLE_ATTRIBUTES = [
  CombatAttribute.Strength,
  CombatAttribute.Dexterity,
  CombatAttribute.Intelligence,
  CombatAttribute.Vitality,
  CombatAttribute.Resilience,
  CombatAttribute.Focus,
  CombatAttribute.Agility,
];

export const COMBAT_ATTRIBUTE_STRINGS: Record<CombatAttribute, string> = {
  [CombatAttribute.ArmorClass]: "Armor Class",
  [CombatAttribute.Dexterity]: "Dexterity",
  [CombatAttribute.Strength]: "Strength",
  [CombatAttribute.Intelligence]: "Intelligence",
  [CombatAttribute.Vitality]: "Vitality",
  [CombatAttribute.Resilience]: "Resilience",
  [CombatAttribute.Agility]: "Agility",
  [CombatAttribute.Accuracy]: "Accuracy",
  [CombatAttribute.Focus]: "Focus",
  [CombatAttribute.Evasion]: "Evasion",
  [CombatAttribute.Speed]: "Speed",
  [CombatAttribute.Hp]: "HP",
  [CombatAttribute.Mp]: "MP",
  [CombatAttribute.ArmorPenetration]: "Armor Pen.",
};

export const COMBAT_ATTRIBUTE_DESCRIPTIONS: Record<CombatAttribute, string> = {
  [CombatAttribute.ArmorPenetration]: "Negates a target's armor class",
  [CombatAttribute.Accuracy]:
    "Chance to hit a target with an evadable attack. Targets that wish to evade will subtract their evasion from this number.",
  [CombatAttribute.ArmorClass]: "Reduces physical damage",
  [CombatAttribute.Evasion]: "Chance to avoid being hit",
  [CombatAttribute.Hp]: "If reduced to zero the combatant can no longer take actions",
  [CombatAttribute.Speed]: "Determines turn order",
  [CombatAttribute.Mp]: "The primary resource for using abilities",
  [CombatAttribute.Focus]:
    "Negates target magic defense and increases crit chance and crit multiplier for magical effects. Increases crit multiplier for ranged attacks.",
  [CombatAttribute.Dexterity]:
    "Increases accuracy, crit chance with physical attacks, ranged attack damage and ranged attack armor penetration",
  [CombatAttribute.Intelligence]: "Increases mana and spell damage",
  [CombatAttribute.Strength]:
    "Increases attack damage, crit multiplier and armor penetration for melee attacks",
  [CombatAttribute.Vitality]: "Increases hit points and armor class",
  [CombatAttribute.Resilience]: `Each point reduces magical damage by ${RESILIENCE_TO_PERCENT_MAGICAL_DAMAGE_REDUCTION_RATIO}%, increases healing received from magical sources by ${RESILIENCE_TO_PERCENT_MAGICAL_HEALING_INCREASE_RATIO}% and reduces the chance of unwanted critical strikes by 1%`,
  [CombatAttribute.Agility]: `Increases evasion and speed`,
};
