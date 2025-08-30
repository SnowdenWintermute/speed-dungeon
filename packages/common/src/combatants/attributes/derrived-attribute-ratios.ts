import { CombatAttribute } from "./index.js";

export const DERIVED_ATTRIBUTE_RATIOS: Partial<
  Record<CombatAttribute, Partial<Record<CombatAttribute, number>>>
> = {
  [CombatAttribute.Dexterity]: {
    [CombatAttribute.Accuracy]: 2,
  },
  [CombatAttribute.Spirit]: {
    [CombatAttribute.Mp]: 2,
  },
  [CombatAttribute.Agility]: {
    [CombatAttribute.Evasion]: 2,
    [CombatAttribute.Speed]: 1,
  },
  [CombatAttribute.Vitality]: {
    [CombatAttribute.Hp]: 2,
    [CombatAttribute.ArmorClass]: 1.5,
  },
};
