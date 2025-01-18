import { CombatantProperties } from "../../combatants/combatant-properties.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { CombatActionType } from "../combat-actions/index.js";
import { ActionResultCalculationArguments } from "./action-result-calculator.js";

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
  const levelAdjustedMpCostResult = CombatantProperties.getAbilityCostIfOwned(
    combatantProperties,
    abilityName
  );
  if (levelAdjustedMpCostResult instanceof Error) return levelAdjustedMpCostResult;
  return levelAdjustedMpCostResult;
}
