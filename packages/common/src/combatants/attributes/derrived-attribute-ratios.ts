import { CombatAttribute } from "./index.js";

export const DERIVED_ATTRIBUTE_RATIOS: Partial<
  Record<CombatAttribute, Partial<Record<CombatAttribute, number>>>
> = {
  [CombatAttribute.Dexterity]: {
    [CombatAttribute.Accuracy]: 1.5,
  },
  [CombatAttribute.Spirit]: {
    [CombatAttribute.Mp]: 1,
  },
  [CombatAttribute.Agility]: {
    [CombatAttribute.Evasion]: 1,
    [CombatAttribute.Speed]: 1,
  },
  [CombatAttribute.Vitality]: {
    [CombatAttribute.Hp]: 2,
    // [CombatAttribute.ArmorClass]: 1.5,
  },
};
