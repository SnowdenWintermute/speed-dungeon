import { getAbilityCostIfOwned } from "../../combatants/abilities/ability-mana-cost-getters";
import { SpeedDungeonGame } from "../../game";
import { CombatActionType } from "../combat-actions";
import { ActionResultCalculationArguments } from "./action-result-calculator";

export default function calculateActionManaCost(
  game: SpeedDungeonGame,
  args: ActionResultCalculationArguments
) {
  const { combatAction, userId } = args;
  if (combatAction.type === CombatActionType.ConsumableUsed) return null;

  const combatantResult = SpeedDungeonGame.getCombatantById(game, userId);
  if (combatantResult instanceof Error) return combatantResult;
  const { combatantProperties } = combatantResult;
  const { abilityName } = combatAction;
  const levelAdjustedMpCostResult = getAbilityCostIfOwned(combatantProperties, abilityName);
  if (levelAdjustedMpCostResult instanceof Error) return levelAdjustedMpCostResult;
  return levelAdjustedMpCostResult;
}
