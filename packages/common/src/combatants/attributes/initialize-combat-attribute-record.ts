import { CombatAttribute } from "./index.js";

export function initializeCombatAttributeRecord() {
  const allAttributesAsZero: Record<CombatAttribute, number> = {
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
  return allAttributesAsZero;
}
