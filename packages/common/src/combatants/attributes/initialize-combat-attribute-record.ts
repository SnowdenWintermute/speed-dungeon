import { CombatAttribute } from "./index.js";

// spread of this template, not a fresh literal: an object literal with computed enum keys is built
// key by key and benchmarks ~25x slower. do not freeze it — freezing makes the spread slower than
// the literal it replaced
const ALL_ATTRIBUTES_AS_ZERO: Record<CombatAttribute, number> = {
  [CombatAttribute.Strength]: 0,
  [CombatAttribute.Dexterity]: 0,
  [CombatAttribute.Spirit]: 0,
  [CombatAttribute.Vitality]: 0,
  [CombatAttribute.Agility]: 0,
  [CombatAttribute.Speed]: 0,
  [CombatAttribute.ArmorClass]: 0,
  [CombatAttribute.ArmorPenetration]: 0,
  [CombatAttribute.Accuracy]: 0,
  [CombatAttribute.Evasion]: 0,
  [CombatAttribute.Hp]: 0,
  [CombatAttribute.Mp]: 0,
};

export function initializeCombatAttributeRecord(): Record<CombatAttribute, number> {
  return { ...ALL_ATTRIBUTES_AS_ZERO };
}
