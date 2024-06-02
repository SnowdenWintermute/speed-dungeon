import { Battle } from ".";
import { ERROR_MESSAGES } from "../errors";

export default function getAllyAndEnemyBattleGroups(battle: Battle, combatantId: string) {
  for (const id of battle.groupA.combatantIds) {
    if (id === combatantId) return [battle.groupA, battle.groupB];
  }
  for (const id of battle.groupB.combatantIds) {
    if (id === combatantId) return [battle.groupB, battle.groupA];
  }

  return new Error(ERROR_MESSAGES.BATTLE.COMBATANT_NOT_IN_BATTLE);
}
