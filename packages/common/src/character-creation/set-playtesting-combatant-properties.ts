import { CombatantProperties } from "../combatants/combatant-properties.js";

export function setPlaytestingCombatantProperties(combatantProperties: CombatantProperties) {
  const { classProgressionProperties } = combatantProperties;
  classProgressionProperties.experiencePoints.changeExperience(400);
  classProgressionProperties.awardLevelups();

  combatantProperties.attributeProperties.changeUnspentPoints(30);
}
