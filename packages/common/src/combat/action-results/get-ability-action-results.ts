import { Battle } from "../../battle";
import { CombatantAbility, CombatantAbilityName, CombatantProperties } from "../../combatants";
import { ERROR_MESSAGES } from "../../errors";
import { SpeedDungeonGame } from "../../game";
import { CombatActionType } from "../combat-actions";
import { CombatActionTarget } from "../targeting/combat-action-targets";
import { ActionResult } from "./action-result";
import { ActionResultCalculationArguments } from "./action-result-calculator";
import calculateActionResult from "./calculate-action-result";
import calculateAttackActionResult from "./non-standard-action-result-handlers/attack";

export default function getAbilityActionResults(
  game: SpeedDungeonGame,
  userId: string,
  abilityName: CombatantAbilityName,
  abilityTarget: CombatActionTarget,
  battleOption: null | Battle,
  allyIds: string[]
): Error | ActionResult[] {
  const userCombatantResult = SpeedDungeonGame.getCombatantById(game, userId);
  if (userCombatantResult instanceof Error) return userCombatantResult;
  const { combatantProperties: userCombatantProperties } = userCombatantResult;
  const abilityResult = CombatantProperties.getAbilityIfOwned(userCombatantProperties, abilityName);
  if (abilityResult instanceof Error) return abilityResult;

  const args: ActionResultCalculationArguments = {
    combatAction: { type: CombatActionType.AbilityUsed, abilityName },
    userId,
    targets: abilityTarget,
    battleOption,
    allyIds,
  };

  switch (abilityName) {
    case CombatantAbilityName.AttackMeleeMainhand:
    case CombatantAbilityName.AttackMeleeOffhand:
    case CombatantAbilityName.AttackRangedMainhand:
      return new Error(ERROR_MESSAGES.ABILITIES.INVALID_TYPE);
    case CombatantAbilityName.Attack:
      return calculateAttackActionResult(game, args);
    case CombatantAbilityName.Fire:
    case CombatantAbilityName.Ice:
    case CombatantAbilityName.Healing:
      const actionResultResult = calculateActionResult(game, args);
      if (actionResultResult instanceof Error) return actionResultResult;
      return [actionResultResult];
  }
}
