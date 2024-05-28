import { AdventuringParty } from "../adventuring_party";
import { CombatAction, CombatActionType } from "../combat/combat-actions";
import { ERROR_MESSAGES } from "../errors";
import { ItemPropertiesType } from "../items/item-properties";
import { CombatantAbility } from "./abilities";
import { CombatantProperties } from "./combatant-properties";

export function getCombatActionPropertiesIfOwned(
  this: CombatantProperties,
  combatAction: CombatAction
) {
  switch (combatAction.type) {
    case CombatActionType.AbilityUsed:
      if (!this.abilities[combatAction.abilityName]) {
        return new Error(ERROR_MESSAGES.ABILITIES.NOT_OWNED);
      } else return CombatantAbility.getAttributes(combatAction.abilityName).combatActionProperties;
    case CombatActionType.ConsumableUsed:
      const consumableProperties = this.inventory.getConsumableProperties(combatAction.itemId);
      if (consumableProperties instanceof Error) return consumableProperties;
      return consumableProperties.getActionProperties();
  }
}

// for getting properties of consumables on the ground for example
export function getCombatActionProperties(
  this: AdventuringParty,
  combatAction: CombatAction,
  actionUserId: string
) {
  switch (combatAction.type) {
    case CombatActionType.AbilityUsed:
      return CombatantAbility.getAttributes(combatAction.abilityName).combatActionProperties;
    case CombatActionType.ConsumableUsed:
      const combatantResult = this.getCombatant(actionUserId);
      if (combatantResult instanceof Error) return combatantResult;
      const { entityProperties: _, combatantProperties: combatantProperties } = combatantResult;
      const consumablePropertiesInInventoryResult =
        combatantProperties.inventory.getConsumableProperties(combatAction.itemId);
      // if they don't own it, check everywhere else in the party for the item
      if (consumablePropertiesInInventoryResult instanceof Error) {
        const itemResult = this.getItem(combatAction.itemId);
        if (itemResult instanceof Error) return consumablePropertiesInInventoryResult;
        switch (itemResult.itemProperties.type) {
          case ItemPropertiesType.Equipment:
            return new Error(ERROR_MESSAGES.ITEM.INVALID_TYPE);
          case ItemPropertiesType.Consumable:
            return itemResult.itemProperties.consumableProperties.getActionProperties();
        }
      }

      return consumablePropertiesInInventoryResult.getActionProperties();
  }
}
