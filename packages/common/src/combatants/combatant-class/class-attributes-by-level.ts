import { CombatAttribute } from "../attributes/index.js";
import { CombatantClass } from "./classes.js";

export const COMBATANT_CLASS_ATTRIBUTES_BY_LEVEL: Record<
  CombatantClass,
  Partial<Record<CombatAttribute, number>>
> = {
  [CombatantClass.Warrior]: {
    // DERIVED
    [CombatAttribute.Hp]: 2.0,
    [CombatAttribute.Mp]: 1.0,
    // CORE
    [CombatAttribute.Strength]: 2.5,
    [CombatAttribute.Dexterity]: 1.5,
    [CombatAttribute.Spirit]: 0.5,
    [CombatAttribute.Vitality]: 1.75,
    [CombatAttribute.Agility]: 0.75,
  },
  [CombatantClass.Rogue]: {
    // DERIVED
    [CombatAttribute.Hp]: 1.5,
    [CombatAttribute.Mp]: 1.5,
    // CORE
    [CombatAttribute.Strength]: 1.25,
    [CombatAttribute.Dexterity]: 2.5,
    [CombatAttribute.Spirit]: 0.75,
    [CombatAttribute.Vitality]: 1,
    [CombatAttribute.Agility]: 1.5,
  },
  [CombatantClass.Mage]: {
    // DERIVED
    [CombatAttribute.Hp]: 1.0,
    [CombatAttribute.Mp]: 2.0,
    // CORE
    [CombatAttribute.Strength]: 1,
    [CombatAttribute.Dexterity]: 1.75,
    [CombatAttribute.Spirit]: 2.5,
    [CombatAttribute.Vitality]: 1,
    [CombatAttribute.Agility]: 0.75,
  },
};
