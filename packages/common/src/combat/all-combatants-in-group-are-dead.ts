import { SpeedDungeonGame } from "../game";

export default function allCombatantsInGroupAreDead(
  game: SpeedDungeonGame,
  combatantIds: string[]
): Error | boolean {
  for (const id of combatantIds) {
    const combatantResult = SpeedDungeonGame.getCombatantById(game, id);
    if (combatantResult instanceof Error) return combatantResult;
    const { combatantProperties } = combatantResult;
    if (combatantProperties.hitPoints > 0) return false;
  }

  return true;
}
