import { CombatAttribute } from "../attributes/index.js";
import { CombatantClass } from "./classes.js";

export const BASE_STARTING_ATTRIBUTES: Record<
  CombatantClass,
  Partial<Record<CombatAttribute, number>>
> = {
  [CombatantClass.Warrior]: {
    [CombatAttribute.Hp]: 20,
    [CombatAttribute.Mp]: 2,
    [CombatAttribute.Accuracy]: 80,
  },
  [CombatantClass.Mage]: {
    [CombatAttribute.Hp]: 15,
    [CombatAttribute.Mp]: 4,
    [CombatAttribute.Accuracy]: 78,
  },
  [CombatantClass.Rogue]: {
    [CombatAttribute.Hp]: 18,
    [CombatAttribute.Mp]: 3,
    [CombatAttribute.Accuracy]: 90,
  },
};
