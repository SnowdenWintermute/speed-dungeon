export enum CombatantClass {
  Warrior,
  Mage,
  Rogue,
}

export function formatCombatantClassName(combatantClass: CombatantClass): string {
  switch (combatantClass) {
    case CombatantClass.Warrior:
      return "Warrior";
    case CombatantClass.Mage:
      return "Mage";
    case CombatantClass.Rogue:
      return "Rogue";
  }
}

export const COMBATANT_CLASS_DESCRIPTIONS = {
  [CombatantClass.Warrior]: "A strong and tough fighter specializing in melee combat",
  [CombatantClass.Mage]: "A spellcaster with a talent for elemental magic and healing",
  [CombatantClass.Rogue]: "An accurate and swift expert in both melee and ranged attacks",
};
