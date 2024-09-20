import { AdventuringParty } from "../adventuring_party/index.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { ConsumableProperties } from "../items/index.js";
import getCombatantInParty from "../adventuring_party/get-combatant-in-party.js";
import { getItemInAdventuringParty } from "../adventuring_party/get-item-in-party.js";
import {
  CombatAction,
  CombatActionProperties,
  CombatActionType,
} from "../combat/combat-actions/index.js";
import { ItemPropertiesType } from "../items/item-properties.js";
import getAbilityAttributes from "./abilities/get-ability-attributes.js";
import { CombatantProperties } from "./combatant-properties.js";
import { Inventory } from "./inventory.js";

export function getCombatActionPropertiesIfOwned(
  combatantProperties: CombatantProperties,
  combatAction: CombatAction
): Error | CombatActionProperties {
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
      return ConsumableProperties.getActionProperties(consumableProperties);
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
            return ConsumableProperties.getActionProperties(
              itemResult.itemProperties.consumableProperties
            );
        }
      }

      if (consumablePropertiesInInventoryResult instanceof Error)
        return consumablePropertiesInInventoryResult;

      return ConsumableProperties.getActionProperties(consumablePropertiesInInventoryResult);
  }
}
