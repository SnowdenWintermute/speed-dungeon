import { ActionResultCalculationArguments } from ".";
import { getAbilityCostIfOwned } from "../../../combatants/abilities/ability-mana-cost-getters";
import { ERROR_MESSAGES } from "../../../errors";
import { SpeedDungeonGame } from "../../../game";
import { CombatActionType } from "../../combat-actions";

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
  if (combatantProperties.mana < levelAdjustedMpCostResult)
    return new Error(ERROR_MESSAGES.ABILITIES.INSUFFICIENT_MANA);
  return levelAdjustedMpCostResult;
}
