import { Battle, BattleGroup } from ".";
import { ERROR_MESSAGES } from "../errors";

export interface AllAndEnemyBattleGroups {
  allyGroup: BattleGroup;
  enemyGroup: BattleGroup;
}

export function getAllyAndEnemyBattleGroups(
  battle: Battle,
  combatantId: string
): Error | AllAndEnemyBattleGroups {
  for (const id of battle.groupA.combatantIds) {
    if (id === combatantId) return { allyGroup: battle.groupA, enemyGroup: battle.groupB };
  }
  for (const id of battle.groupB.combatantIds) {
    if (id === combatantId) return { allyGroup: battle.groupB, enemyGroup: battle.groupA };
  }

  return new Error(ERROR_MESSAGES.BATTLE.COMBATANT_NOT_IN_BATTLE);
}
