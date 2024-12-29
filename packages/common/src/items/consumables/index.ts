import { EntityProperties } from "../../primatives/entity-properties.js";
import getConsumableCombatActionProperties from "./get-consumable-combat-action-properties.js";
import { Item } from "../index.js";
import { CombatAttribute } from "../../attributes/index.js";

export enum ConsumableType {
  HpAutoinjector,
  MpAutoinjector,
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
  static getActionProperties = getConsumableCombatActionProperties;
}

export function formatConsumableType(consumableType: ConsumableType) {
  switch (consumableType) {
    case ConsumableType.HpAutoinjector:
      return "Green Autoinjector";
    case ConsumableType.MpAutoinjector:
      return "Blue Autoinjector";
  }
}
