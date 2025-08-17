export enum CombatantClass {
  Warrior,
  Mage,
  Rogue,
}

export const COMBATANT_CLASS_NAME_STRINGS: Record<CombatantClass, string> = {
  [CombatantClass.Warrior]: "Warrior",
  [CombatantClass.Mage]: "Mage",
  [CombatantClass.Rogue]: "Rogue",
};

export const COMBATANT_CLASS_DESCRIPTIONS = {
  [CombatantClass.Warrior]: "A strong and tough fighter specializing in melee combat",
  [CombatantClass.Mage]: "A spellcaster with a talent for elemental magic and healing",
  [CombatantClass.Rogue]: "An accurate and swift expert in both melee and ranged attacks",
};
