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

  let numCharactersAlive = 0;
  for (const combatant of partyCombatants) {
    const isAlive = !combatant.combatantProperties.isDead();
    if (isAlive) numCharactersAlive += 1;
  }

  for (const combatant of partyCombatants) {
    const { combatantProperties } = combatant;
    const isDead = combatantProperties.isDead();
    if (isDead) continue;

    let totalExpToAward = 0;

    for (const monsterLevel of defeatedMonsterLevels) {
      const baseExp = BASE_XP_PER_MONSTER / numCharactersAlive;
      const levelDifference =
        combatantProperties.classProgressionProperties.getMainClass().level - monsterLevel;
      const diffMultiplier = BASE_XP_LEVEL_DIFF_MULTIPLIER * Math.abs(levelDifference);

      const sign = levelDifference > 0 ? -1 : 1;
      const expToAwardForThisMonster = Math.max(0, baseExp + baseExp * diffMultiplier * sign);
      totalExpToAward += expToAwardForThisMonster;
    }

    experiencePointChanges[combatant.entityProperties.id] = Math.floor(totalExpToAward);
  }

  return experiencePointChanges;
}
