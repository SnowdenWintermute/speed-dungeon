import { AdventuringParty } from "../adventuring_party";
import getCombatantInParty from "../adventuring_party/get-combatant-in-party";
import { getItemInAdventuringParty } from "../adventuring_party/get-item-in-party";
import { CombatAction, CombatActionType } from "../combat/combat-actions";
import { ERROR_MESSAGES } from "../errors";
import { ItemPropertiesType } from "../items/item-properties";
import getAbilityAttributes from "./abilities/get-ability-attributes";
import { CombatantProperties } from "./combatant-properties";
import Inventory from "./inventory";

export function getCombatActionPropertiesIfOwned(
  combatantProperties: CombatantProperties,
  combatAction: CombatAction
) {
  switch (combatAction.type) {
    case CombatActionType.AbilityUsed:
      if (!combatantProperties.abilities[combatAction.abilityName]) {
        return new Error(ERROR_MESSAGES.ABILITIES.NOT_OWNED);
      } else {
        // for some reason the static method gets the error "is not a function" in nextjs so using it directly here
        const toReturn = getAbilityAttributes(combatAction.abilityName).combatActionProperties;
        return toReturn;
      }
    case CombatActionType.ConsumableUsed:
      const consumableProperties = Inventory.getConsumableProperties(
        combatantProperties.inventory,
        combatAction.itemId
      );
      if (consumableProperties instanceof Error) return consumableProperties;
      return consumableProperties.getActionProperties();
  }
}

// for getting properties of consumables on the ground for example
export function getCombatActionProperties(
  party: AdventuringParty,
  combatAction: CombatAction,
  actionUserId: string
) {
  switch (combatAction.type) {
    case CombatActionType.AbilityUsed:
      return getAbilityAttributes(combatAction.abilityName).combatActionProperties;
    case CombatActionType.ConsumableUsed:
      const combatantResult = getCombatantInParty(party, actionUserId);
      if (combatantResult instanceof Error) return combatantResult;
      const { entityProperties: _, combatantProperties: combatantProperties } = combatantResult;
      const consumablePropertiesInInventoryResult = Inventory.getConsumableProperties(
        combatantProperties.inventory,
        combatAction.itemId
      );
      // if they don't own it, check everywhere else in the party for the item
      if (consumablePropertiesInInventoryResult instanceof Error) {
        const itemResult = getItemInAdventuringParty(party, combatAction.itemId);
        if (itemResult instanceof Error) return consumablePropertiesInInventoryResult;
        switch (itemResult.itemProperties.type) {
          case ItemPropertiesType.Equipment:
            return new Error(ERROR_MESSAGES.ITEM.INVALID_TYPE);
          case ItemPropertiesType.Consumable:
            return itemResult.itemProperties.consumableProperties.getActionProperties();
        }
      }

      if (consumablePropertiesInInventoryResult instanceof Error)
        return consumablePropertiesInInventoryResult;

      return consumablePropertiesInInventoryResult.getActionProperties();
  }
}
