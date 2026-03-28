import cloneDeep from "lodash.clonedeep";
import { CombatAttribute } from "../combatants/attributes/index.js";
import { Consumable } from "./consumables/index.js";
import { EntityProperties } from "../primatives/entity-properties.js";
import { CombatantAttributeRecord } from "../combatants/combatant-attribute-record.js";
import { iterateNumericEnumKeyedRecord } from "../utils/index.js";
import { ConsumableType } from "./consumables/consumable-types.js";
import { ItemId } from "../aliases.js";

export enum ItemType {
  Consumable,
  Equipment,
}

export const ITEM_TYPE_STRINGS: Record<ItemType, string> = {
  [ItemType.Consumable]: "Consumable",
  [ItemType.Equipment]: "Equipment",
};

export abstract class Item {
  // used on client to distinguish crafting results on an item since we can't change the id as it is
  // needed to match the crafting result with the item in the client combatant's inventory
  craftingIteration?: number;
  constructor(
    public entityProperties: EntityProperties,
    public itemLevel: number,
    public requirements: Partial<Record<CombatAttribute, number>>
  ) {}

  copyFrom<T extends this>(source: T): void {
    Object.assign(this, cloneDeep(source));
  }

  getEntityId() {
    return this.entityProperties.id as ItemId;
  }

  static removeFromArray(array: Item[], itemId: string) {
    let indexToRemove = -1;
    array.forEach((item, i) => {
      if (item.entityProperties.id === itemId) {
        indexToRemove = i;
        return;
      }
    });
    if (indexToRemove !== -1) {
      return array.splice(indexToRemove, 1)[0];
    }
  }

  static requirementsMet(item: Item, combatantAttributes: CombatantAttributeRecord) {
    for (const [key, requiredValue] of iterateNumericEnumKeyedRecord(item.requirements)) {
      const combatantAttributeValue = combatantAttributes[key];
      if (!combatantAttributeValue) return false;
      if (combatantAttributeValue < requiredValue) return false;
    }
    return true;
  }

  static isConsumable(item: Item) {
    return item instanceof Consumable;
  }

  getType() {
    return this instanceof Consumable ? ItemType.Consumable : ItemType.Equipment;
  }

  isShardStack(): this is Consumable & { consumableType: ConsumableType.StackOfShards } {
    return this instanceof Consumable && this.consumableType === ConsumableType.StackOfShards;
  }
}
