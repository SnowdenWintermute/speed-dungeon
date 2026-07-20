import { AdventuringParty } from "../../../../adventuring-party/index.js";
import { CombatantId } from "../../../../aliases.js";
import { BASE_XP_LEVEL_DIFF_MULTIPLIER, BASE_XP_PER_MONSTER } from "../../../../app-consts.js";
import { getMonsterRewardProfile } from "../../../../monsters/monster-reward-profiles.js";

export function generateExperiencePoints(party: AdventuringParty) {
  const experiencePointChanges: Record<CombatantId, number> = {};

  const defeatedMonsters = party.combatantManager.getDungeonControlledCombatants().map((monster) => {
    const { monsterType } = monster.combatantProperties;
    const experience =
      monsterType === null ? BASE_XP_PER_MONSTER : getMonsterRewardProfile(monsterType).experience;
    return {
      level: monster.combatantProperties.classProgressionProperties.getMainClass().level,
      experience,
    };
  });

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

    for (const defeatedMonster of defeatedMonsters) {
      const baseExp = defeatedMonster.experience / combatantsEligableToReceiveExpCount;
      const levelDifference = classProgressionProperties.getMainClass().level - defeatedMonster.level;
      const diffMultiplier = BASE_XP_LEVEL_DIFF_MULTIPLIER * Math.abs(levelDifference);

      const sign = levelDifference > 0 ? -1 : 1;
      const expToAwardForThisMonster = Math.max(0, baseExp + baseExp * diffMultiplier * sign);
      totalExpToAward += expToAwardForThisMonster;
    }

    experiencePointChanges[combatant.getEntityId()] = Math.floor(totalExpToAward);
  }

  return experiencePointChanges;
}
