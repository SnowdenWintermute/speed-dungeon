import { CombatAttributes } from "../combatants/combat-attributes";
import { EntityProperties } from "../primatives";
import { ItemProperties } from "./item-properties";

export default class Item {
  constructor(
    public entityProperties: EntityProperties,
    public itemLevel: number,
    public requirements: Record<CombatAttributes, number>,
    public itemProperties: ItemProperties
  ) {}
}
