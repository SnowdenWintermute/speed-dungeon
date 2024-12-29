import { CombatAttribute } from "../attributes/index.js";
import { EntityProperties } from "../primatives/index.js";
import itemRequirementsMet from "./requirements-met.js";

export enum ItemType {
  Consumable,
  Equipment,
}

export class Item {
  constructor(
    public entityProperties: EntityProperties,
    public itemLevel: number,
    public requirements: Partial<Record<CombatAttribute, number>>
  ) {}

  static fromObject(item: Item) {
    return new Item(item.entityProperties, item.itemLevel, item.requirements);
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
}
