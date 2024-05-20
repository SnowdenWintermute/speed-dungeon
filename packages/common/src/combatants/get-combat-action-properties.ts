import { CombatAction, CombatActionType } from "../combat/combat-actions";
import { ERROR_MESSAGES } from "../errors";
import { CombatantAbility } from "./abilities";
import { CombatantProperties } from "./combatant-properties";

export function getCombatActionPropertiesIfOwned(
  this: CombatantProperties,
  combatAction: CombatAction
) {
  switch (combatAction.type) {
    case CombatActionType.AbilityUsed:
      if (!Object.keys(this.abilities).includes(combatAction.abilityName.toString()))
        return new Error(ERROR_MESSAGES.ABILITIES.NOT_OWNED);
      else return CombatantAbility.getAttributes(combatAction.abilityName).combatActionProperties;
    case CombatActionType.ConsumableUsed:
      console.log(combatAction.itemId);
      break;
  }
}

// will work even if consumable isn't in inventory
export function getCombatActionProperties() {}
