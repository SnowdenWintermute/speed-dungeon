import { CombatAttribute } from "../combatants/combat-attributes";
import { EntityProperties } from "../primatives";
import { ItemProperties } from "./item-properties";

export default class Item {
  constructor(
    public entityProperties: EntityProperties,
    public itemLevel: number,
    public requirements: Record<CombatAttribute, number>,
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
}
