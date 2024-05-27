export * from "./equipment/";

import { CombatAttribute } from "../combatants/combat-attributes";
import { EntityProperties } from "../primatives";
import createConsumableByType from "./consumables/create-consumable-by-type";
import { ItemProperties } from "./item-properties";
import itemRequirementsMet from "./requirements-met";

export class Item {
  constructor(
    public entityProperties: EntityProperties,
    public itemLevel: number,
    public requirements: Partial<Record<CombatAttribute, number>>,
    public itemProperties: ItemProperties
  ) {}

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

  requirementsMet = itemRequirementsMet;
}
