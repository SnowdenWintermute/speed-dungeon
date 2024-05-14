export enum CombatAttributes {
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
  CombatAttributes.Dexterity,
  CombatAttributes.Intelligence,
  CombatAttributes.Strength,
  CombatAttributes.Vitality,
];

export const ATTRIBUTE_POINT_ASSIGNABLE_ATTRIBUTES = [
  CombatAttributes.Dexterity,
  CombatAttributes.Intelligence,
  CombatAttributes.Strength,
  CombatAttributes.Vitality,
  CombatAttributes.Resilience,
  CombatAttributes.Focus,
  CombatAttributes.Agility,
];

function getCombatAttributeDescription(attribute: CombatAttributes) {
  switch (attribute) {
    case CombatAttributes.Damage:
      "A flat bonus applied to physical attacks";
    case CombatAttributes.ArmorPenetration:
      "Negates a target's armor class";
    case CombatAttributes.Accuracy:
      "Chance to hit a target with an evadable attack";
    case CombatAttributes.ArmorClass:
      "Reduces physical damage";
    case CombatAttributes.Evasion:
      "Chance to avoid being hit";
    case CombatAttributes.Hp:
      "If reduced to zero; the combatant can no longer take actions";
    case CombatAttributes.Speed:
      "Determines turn order";
    case CombatAttributes.Mp:
      "The primary resource for using abilities";
    case CombatAttributes.Focus:
      "Negates magic defense and increases crit chance and crit multiplier for spells";
    case CombatAttributes.Dexterity:
      "Increases accuracy; crit chance with physical attacks, ranged attack damage and ranged attack armor penetration";
    case CombatAttributes.Intelligence:
      "Increases mana and spell damage";
    case CombatAttributes.Strength:
      "Increases attack damage; crit multiplier and armor penetration with physical attacks";
    case CombatAttributes.Vitality:
      "Increases hit points";
    case CombatAttributes.Resilience:
      "Reduces magical damage by a percentage and increases healing received from spells";
    case CombatAttributes.Agility:
      "Increases evasion and speed";
  }
}
