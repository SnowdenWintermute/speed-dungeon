import {
  AdventuringParty,
  BASE_XP_LEVEL_DIFF_MULTIPLIER,
  BASE_XP_PER_MONSTER,
} from "@speed-dungeon/common";

export function generateExperiencePoints(party: AdventuringParty) {
  const experiencePointChanges: { [combatantId: string]: number } = {};

  const defeatedMonsterLevels = party.combatantManager
    .getDungeonControlledCombatants()
    .map((monster) => monster.combatantProperties.classProgressionProperties.getMainClass().level);

  const { combatantManager } = party;
  const partyCombatants = combatantManager.getPartyMemberCombatants();

  let combatantsEligableToReceiveExpCount = 0;
  for (const combatant of partyCombatants) {
    const { classProgressionProperties } = combatant.combatantProperties;
    const isEligable = classProgressionProperties.isEligableToReceiveExperiencePoints(party);
    if (isEligable) {
      combatantsEligableToReceiveExpCount += 1;
    }
  }

  for (const combatant of partyCombatants) {
    const { classProgressionProperties } = combatant.combatantProperties;

    const isEligable = classProgressionProperties.isEligableToReceiveExperiencePoints(party);
    const notEligableToReceiveExp = !isEligable;
    if (notEligableToReceiveExp) {
      continue;
    }

    let totalExpToAward = 0;

    for (const monsterLevel of defeatedMonsterLevels) {
      const baseExp = BASE_XP_PER_MONSTER / combatantsEligableToReceiveExpCount;
      const levelDifference = classProgressionProperties.getMainClass().level - monsterLevel;
      const diffMultiplier = BASE_XP_LEVEL_DIFF_MULTIPLIER * Math.abs(levelDifference);

      const sign = levelDifference > 0 ? -1 : 1;
      const expToAwardForThisMonster = Math.max(0, baseExp + baseExp * diffMultiplier * sign);
      totalExpToAward += expToAwardForThisMonster;
    }

    experiencePointChanges[combatant.entityProperties.id] = Math.floor(totalExpToAward);
  }

  return experiencePointChanges;
}
