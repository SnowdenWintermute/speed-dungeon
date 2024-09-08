import {
  AdventuringParty,
  BASE_XP_LEVEL_DIFF_MULTIPLIER,
  BASE_XP_PER_MONSTER,
} from "@speed-dungeon/common";

export default function generateExperiencePoints(party: AdventuringParty) {
  const defeatedMonsterLevels = Object.values(party.currentRoom.monsters).map(
    (monster) => monster.combatantProperties.level
  );

  let numCharactersAlive = 0;
  for (const character of Object.values(party.characters))
    if (character.combatantProperties.hitPoints > 0) numCharactersAlive += 1;

  const experiencePointChanges: { [combatantId: string]: number } = {};
  for (const character of Object.values(party.characters)) {
    if (character.combatantProperties.hitPoints <= 0) continue;

    let totalExpToAward = 0;

    for (const monsterLevel of defeatedMonsterLevels) {
      let baseExp = BASE_XP_PER_MONSTER / numCharactersAlive;
      let levelDifference = character.combatantProperties.level - monsterLevel;
      let diffMultiplier = BASE_XP_LEVEL_DIFF_MULTIPLIER * Math.abs(levelDifference);

      const sign = levelDifference > 0 ? -1 : 1;
      const expToAwardForThisMonster = Math.min(0, baseExp + baseExp * diffMultiplier * sign);
      totalExpToAward += expToAwardForThisMonster;
    }

    experiencePointChanges[character.entityProperties.id] = totalExpToAward;
  }

  return experiencePointChanges;
}
