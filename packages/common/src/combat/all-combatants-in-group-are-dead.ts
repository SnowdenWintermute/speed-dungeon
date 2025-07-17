import { CombatantProperties } from "../combatants/index.js";
import { SpeedDungeonGame } from "../game/index.js";

export function allCombatantsInGroupAreDead(
  game: SpeedDungeonGame,
  combatantIds: string[]
): Error | boolean {
  if (combatantIds.length === 0) return false;
  for (const id of combatantIds) {
    const combatantResult = SpeedDungeonGame.getCombatantById(game, id);
    if (combatantResult instanceof Error) return combatantResult;
    const { combatantProperties } = combatantResult;
    if (!CombatantProperties.isDead(combatantProperties)) return false;
  }

  return true;
}
