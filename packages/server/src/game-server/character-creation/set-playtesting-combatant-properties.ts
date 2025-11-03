import { CombatAttribute, CombatantProperties } from "@speed-dungeon/common";

export function setPlaytestingCombatantProperties(combatantProperties: CombatantProperties) {
  const { classProgressionProperties } = combatantProperties;
  classProgressionProperties.experiencePoints.changeExperience(500);
  classProgressionProperties.awardLevelups();

  combatantProperties.attributeProperties.changeUnspentPoints(30);
}

const TESTING_INHERENT_ATTRIBUTES: Partial<Record<CombatAttribute, number>> = {
  [CombatAttribute.Speed]: 9,
  [CombatAttribute.Dexterity]: 9,
  // [CombatAttribute.Accuracy]: 200,
  // [CombatAttribute.Strength]: 40,
  // [CombatAttribute.Spirit]: 10,
  // [CombatAttribute.Mp]: 100,
  // [CombatAttribute.Evasion]: 100,
  // [CombatAttribute.Hp]: 759,
};
