import { AdventuringParty } from "../adventuring-party/index.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import getCombatantInParty from "../adventuring-party/get-combatant-in-party.js";
import { getItemInAdventuringParty } from "../adventuring-party/get-item-in-party.js";
import {
  CombatAction,
  CombatActionProperties,
  CombatActionType,
} from "../combat/combat-actions/index.js";
import { CombatantProperties } from "./combatant-properties.js";
import { Inventory } from "./inventory.js";
import { ABILITY_ATTRIBUTES } from "./abilities/get-ability-attributes.js";
import { Consumable } from "../items/consumables/index.js";
import { createDummyConsumable } from "../utils/index.js";

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
        const toReturn = ABILITY_ATTRIBUTES[combatAction.abilityName].combatActionProperties;
        return toReturn;
      }
    case CombatActionType.ConsumableUsed:
      const consumableProperties = Inventory.getConsumableById(
        combatantProperties.inventory,
        combatAction.itemId
      );
      if (consumableProperties instanceof Error) return consumableProperties;
      return Consumable.getActionProperties(consumableProperties);
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
      return ABILITY_ATTRIBUTES[combatAction.abilityName].combatActionProperties;
    case CombatActionType.ConsumableUsed:
      // if there is a consumableId on the action, that means it was generated
      // client side by the shop menu or otherwise based off an item that doesn't really exist,
      // we just want to show it's action details
      if (combatAction.consumableType !== undefined) {
        console.log("create dummy consumable action result");
        const dummyConsumable = createDummyConsumable(combatAction.consumableType);
        return Consumable.getActionProperties(dummyConsumable);
      }

      const combatantResult = getCombatantInParty(party, actionUserId);
      if (combatantResult instanceof Error) return combatantResult;
      const { entityProperties: _, combatantProperties: combatantProperties } = combatantResult;
      const consumablePropertiesInInventoryResult = Inventory.getConsumableById(
        combatantProperties.inventory,
        combatAction.itemId
      );
      // if they don't own it, check everywhere else in the party for the item
      if (consumablePropertiesInInventoryResult instanceof Error) {
        const itemResult = getItemInAdventuringParty(party, combatAction.itemId);
        if (itemResult instanceof Error) return consumablePropertiesInInventoryResult;
        if (!(itemResult instanceof Consumable)) return new Error(ERROR_MESSAGES.ITEM.INVALID_TYPE);
        return Consumable.getActionProperties(itemResult);
      }

      if (consumablePropertiesInInventoryResult instanceof Error)
        return consumablePropertiesInInventoryResult;

      return Consumable.getActionProperties(consumablePropertiesInInventoryResult);
  }
}
