import getConsumableCombatActionProperties from "./get-consumable-combat-action-properties";

export enum ConsumableType {
  HpAutoinjector,
  MpAutoinjector,
}

export class ConsumableProperties {
  constructor(
    public consumableType: ConsumableType,
    usesRemaining: number
  ) {}
  getActionProperties = getConsumableCombatActionProperties;
}
