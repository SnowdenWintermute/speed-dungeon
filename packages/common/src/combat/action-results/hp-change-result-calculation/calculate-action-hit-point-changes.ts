import { SpeedDungeonGame } from "../../../game";
import { CombatActionProperties } from "../../combat-actions";
import { ActionResultCalculationArguments } from "../action-result-calculator";

export default function calculateActionHitPointChanges(
  game: SpeedDungeonGame,
  args: ActionResultCalculationArguments,
  targetIds: string[],
  actionProperties: CombatActionProperties
) {
  const hitPointChanges: { [entityId: string]: number } = {};
  const { hpChangeProperties } = actionProperties;
  if (hpChangeProperties === null) return hitPointChanges;

  const { userId, combatAction } = args;
  const combatantResult = SpeedDungeonGame.getCombatantById(game, userId);
  if (combatantResult instanceof Error) return combatantResult;
  const { combatantProperties } = combatantResult;

  // const hpChangeRangeResult = calculateActionHitPointChangeRange
}
