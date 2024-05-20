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

function getCombatAttributeDescription(attribute: CombatAttribute) {
  switch (attribute) {
    case CombatAttribute.Damage:
      "A flat bonus applied to physical attacks";
    case CombatAttribute.ArmorPenetration:
      "Negates a target's armor class";
    case CombatAttribute.Accuracy:
      "Chance to hit a target with an evadable attack";
    case CombatAttribute.ArmorClass:
      "Reduces physical damage";
    case CombatAttribute.Evasion:
      "Chance to avoid being hit";
    case CombatAttribute.Hp:
      "If reduced to zero; the combatant can no longer take actions";
    case CombatAttribute.Speed:
      "Determines turn order";
    case CombatAttribute.Mp:
      "The primary resource for using abilities";
    case CombatAttribute.Focus:
      "Negates magic defense and increases crit chance and crit multiplier for spells";
    case CombatAttribute.Dexterity:
      "Increases accuracy; crit chance with physical attacks, ranged attack damage and ranged attack armor penetration";
    case CombatAttribute.Intelligence:
      "Increases mana and spell damage";
    case CombatAttribute.Strength:
      "Increases attack damage; crit multiplier and armor penetration with physical attacks";
    case CombatAttribute.Vitality:
      "Increases hit points";
    case CombatAttribute.Resilience:
      "Reduces magical damage by a percentage and increases healing received from spells";
    case CombatAttribute.Agility:
      "Increases evasion and speed";
  }
}
