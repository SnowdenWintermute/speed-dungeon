export enum CombatAttribute {
  Strength,
  Dexterity,
  Spirit,
  Vitality,

  Agility,

  Speed,
  ArmorClass,
  ArmorPenetration,
  Accuracy,
  Evasion,

  Hp,
  Mp,
}

export const CORE_ATTRIBUTES = [
  CombatAttribute.Dexterity,
  CombatAttribute.Spirit,
  CombatAttribute.Strength,
  CombatAttribute.Vitality,
  CombatAttribute.Agility,
];

export const ATTRIBUTE_POINT_ASSIGNABLE_ATTRIBUTES = [
  CombatAttribute.Strength,
  CombatAttribute.Dexterity,
  CombatAttribute.Spirit,
  CombatAttribute.Vitality,
  CombatAttribute.Agility,
];

export const COMBAT_ATTRIBUTE_STRINGS: Record<CombatAttribute, string> = {
  [CombatAttribute.ArmorClass]: "Armor Class",
  [CombatAttribute.Dexterity]: "Dexterity",
  [CombatAttribute.Strength]: "Strength",
  [CombatAttribute.Spirit]: "Spirit",
  [CombatAttribute.Vitality]: "Vitality",
  [CombatAttribute.Agility]: "Agility",
  [CombatAttribute.Accuracy]: "Accuracy",
  [CombatAttribute.Evasion]: "Evasion",
  [CombatAttribute.Speed]: "Speed",
  [CombatAttribute.Hp]: "HP",
  [CombatAttribute.Mp]: "MP",
  [CombatAttribute.ArmorPenetration]: "Armor Pen.",
};

export const COMBAT_ATTRIBUTE_DESCRIPTIONS: Record<CombatAttribute, string> = {
  [CombatAttribute.ArmorPenetration]: "Negates a target's armor class.",
  [CombatAttribute.Accuracy]: "Chance to hit with melee and projectile abilities.",
  [CombatAttribute.ArmorClass]: "Reduces physical damage.",
  [CombatAttribute.Evasion]: "Chance to avoid being hit.",
  [CombatAttribute.Hp]: "If reduced to zero the combatant can no longer take actions.",
  [CombatAttribute.Speed]: "Determines turn order.",
  [CombatAttribute.Mp]: "The primary resource for using abilities.",
  [CombatAttribute.Dexterity]:
    "Increases accuracy, crit chance of melee and projectile attacks, kinetic projectile damage, block and parry chance.",
  [CombatAttribute.Spirit]:
    "Increases mana, spell damage and magical healing received. Reduces incoming crit damage from all sources. Reduces magical damage received.",
  [CombatAttribute.Strength]:
    "Increases damage, crit chance, crit multiplier and armor penetration for melee attacks. Increases block chance, damage reduced on block, parry and counterattack chance.",
  [CombatAttribute.Vitality]: "Increases hit points.",
  [CombatAttribute.Agility]: `Increases evasion, speed, chance to avoid being crit, damage reduced on block and counterattack chance.`,
};
