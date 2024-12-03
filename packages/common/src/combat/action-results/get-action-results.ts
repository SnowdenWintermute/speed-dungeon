import { Battle } from "../../battle/index.js";
import { CombatantAbilityName, CombatantProperties } from "../../combatants/index.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { CombatAction, CombatActionType } from "../combat-actions/index.js";
import { CombatActionTarget } from "../targeting/combat-action-targets.js";
import { ActionResult } from "./action-result.js";
import { ActionResultCalculationArguments } from "./action-result-calculator.js";
import calculateActionResult from "./calculate-action-result.js";
import calculateAttackActionResult from "./non-standard-action-result-handlers/attack.js";

export default function getActionResults(
  game: SpeedDungeonGame,
  userId: string,
  combatAction: CombatAction,
  abilityTarget: CombatActionTarget,
  battleOption: null | Battle,
  allyIds: string[]
): Error | ActionResult[] {
  const userCombatantResult = SpeedDungeonGame.getCombatantById(game, userId);
  if (userCombatantResult instanceof Error) return userCombatantResult;
  const { combatantProperties: userCombatantProperties } = userCombatantResult;

  const args: ActionResultCalculationArguments = {
    combatAction,
    userId,
    targets: abilityTarget,
    battleOption,
    allyIds,
  };

  if (combatAction.type === CombatActionType.AbilityUsed) {
    const abilityResult = CombatantProperties.getAbilityIfOwned(
      userCombatantProperties,
      combatAction.abilityName
    );
    if (abilityResult instanceof Error) return abilityResult;

    switch (combatAction.abilityName) {
      case CombatantAbilityName.AttackMeleeMainhand:
      case CombatantAbilityName.AttackMeleeOffhand:
      case CombatantAbilityName.AttackRangedMainhand:
        return new Error(ERROR_MESSAGES.ABILITIES.INVALID_TYPE);
      case CombatantAbilityName.Attack:
        return calculateAttackActionResult(game, args);
      case CombatantAbilityName.Fire:
      case CombatantAbilityName.Ice:
      case CombatantAbilityName.Healing:
      case CombatantAbilityName.Destruction:
        const actionResultResult = calculateActionResult(game, args);
        if (actionResultResult instanceof Error) return actionResultResult;
        return [actionResultResult];
    }
  } else {
    const actionResultResult = calculateActionResult(game, args);
    if (actionResultResult instanceof Error) return actionResultResult;
    return [actionResultResult];
  }
}
