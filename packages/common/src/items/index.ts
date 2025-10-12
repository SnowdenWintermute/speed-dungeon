import cloneDeep from "lodash.clonedeep";
import { EntityProperties } from "../primatives/index.js";
import itemRequirementsMet from "./requirements-met.js";
import { CombatAttribute } from "../combatants/attributes/index.js";
import { Consumable } from "./consumables/index.js";
import { Combatant, CombatantProperties } from "../combatants/index.js";
import { iterateNumericEnumKeyedRecord } from "../utils/index.js";

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

  static requirementsMet = itemRequirementsMet;
  static isConsumable(item: Item) {
    return item instanceof Consumable;
  }
}
