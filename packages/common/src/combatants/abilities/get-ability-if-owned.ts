import { CombatantAbility, CombatantAbilityName } from ".";
import { ERROR_MESSAGES } from "../../errors";
import { CombatantProperties } from "../combatant-properties";

export default function getAbilityIfOwned(
  combatantProperties: CombatantProperties,
  abilityName: CombatantAbilityName
): Error | CombatantAbility {
  const abilityOption = combatantProperties.abilities[abilityName];
  if (!abilityOption) return new Error(ERROR_MESSAGES.ABILITIES.NOT_OWNED);
  return abilityOption;
}
