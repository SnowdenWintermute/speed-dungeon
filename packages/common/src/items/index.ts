import cloneDeep from "lodash.clonedeep";
import { CombatAttribute } from "../attributes/index.js";
import { EntityProperties } from "../primatives/index.js";
import itemRequirementsMet from "./requirements-met.js";

export enum ItemType {
  Consumable,
  Equipment,
}

export abstract class Item {
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
}
