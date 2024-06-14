import { Battle } from "../../battle";
import { CombatantAbility, CombatantAbilityName, CombatantProperties } from "../../combatants";
import { ERROR_MESSAGES } from "../../errors";
import { SpeedDungeonGame } from "../../game";
import { CombatActionTarget } from "../targeting/combat-action-targets";

export default function getAbilityActionResults(
  game: SpeedDungeonGame,
  userId: string,
  abilityName: CombatantAbilityName,
  abilityTarget: CombatActionTarget,
  battleOption: null | Battle
) {
  const userCombatantResult = SpeedDungeonGame.getCombatantById(game, userId);
  if (userCombatantResult instanceof Error) return userCombatantResult;
  const { combatantProperties: userCombatantProperties } = userCombatantResult;
  const abilityResult = CombatantProperties.getAbilityIfOwned(userCombatantProperties, abilityName);
  if (abilityResult instanceof Error) return abilityResult;
  const abilityAttributes = CombatantAbility.getAttributes(abilityName);

  switch (abilityName) {
    case CombatantAbilityName.AttackMeleeMainhand:
    case CombatantAbilityName.AttackMeleeOffhand:
    case CombatantAbilityName.AttackRangedMainhand:
      return new Error(ERROR_MESSAGES.ABILITIES.INVALID_TYPE);
    case CombatantAbilityName.Attack:
    // return attackHandler
    case CombatantAbilityName.Fire:
    case CombatantAbilityName.Ice:
    case CombatantAbilityName.Healing:
    // return calculateActionHpAndMpChanges
  }
}
