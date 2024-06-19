import getConsumableCombatActionProperties from "./get-consumable-combat-action-properties";

export enum ConsumableType {
  HpAutoinjector,
  MpAutoinjector,
}

export class ConsumableProperties {
  constructor(
    public consumableType: ConsumableType,
    public usesRemaining: number
  ) {}
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
