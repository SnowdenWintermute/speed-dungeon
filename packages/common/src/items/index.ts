export * from "./equipment/index.js";
export * from "./consumables/index.js";
export * from "./item-properties.js";

import { CombatAttribute } from "../combatants/combat-attributes.js";
import { EntityProperties } from "../primatives/index.js";
import createConsumableByType from "./consumables/create-consumable-by-type.js";
import getEquipmentProperties from "./get-equipment-properties.js";
import { ItemProperties } from "./item-properties.js";
import itemRequirementsMet from "./requirements-met.js";

export class Item {
  constructor(
    public entityProperties: EntityProperties,
    public itemLevel: number,
    public requirements: Partial<Record<CombatAttribute, number>>,
    public itemProperties: ItemProperties
  ) {}

  static fromObject(item: Item) {
    return new Item(item.entityProperties, item.itemLevel, item.requirements, item.itemProperties);
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
  static createConsumable = createConsumableByType;
  static requirementsMet = itemRequirementsMet;
  static getEquipmentProperties = getEquipmentProperties;
}
