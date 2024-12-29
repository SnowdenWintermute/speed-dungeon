import { CombatantAbility, AbilityName } from "./index.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { CombatantProperties } from "../combatant-properties.js";

export default function getAbilityIfOwned(
  combatantProperties: CombatantProperties,
  abilityName: AbilityName
): Error | CombatantAbility {
  const abilityOption = combatantProperties.abilities[abilityName];
  if (!abilityOption) return new Error(ERROR_MESSAGES.ABILITIES.NOT_OWNED);
  return abilityOption;
}
