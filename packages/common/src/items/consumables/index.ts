import { EntityProperties } from "../../primatives/entity-properties.js";
import { Item } from "../index.js";
import { CombatAttribute } from "../../combatants/attributes/index.js";

export enum ConsumableType {
  HpAutoinjector,
  MpAutoinjector,
  StackOfShards,
}

export class Consumable extends Item {
  constructor(
    public entityProperties: EntityProperties,
    public itemLevel: number,
    public requirements: Partial<Record<CombatAttribute, number>>,
    public consumableType: ConsumableType,
    public usesRemaining: number
  ) {
    super(entityProperties, itemLevel, requirements);
  }
}

export const CONSUMABLE_TYPE_STRINGS: Record<ConsumableType, string> = {
  [ConsumableType.HpAutoinjector]: "Green Autoinjector",
  [ConsumableType.MpAutoinjector]: "Blue Autoinjector",
  [ConsumableType.StackOfShards]: "Stack of Shards",
};
