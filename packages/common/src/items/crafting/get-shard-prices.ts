import { ConsumableType } from "../consumables/index.js";

export const BASE_CONSUMABLE_PRICES: Record<ConsumableType, number> = {
  [ConsumableType.HpAutoinjector]: 10,
  [ConsumableType.MpAutoinjector]: 10,
  [ConsumableType.StackOfShards]: 0,
};

export function getConsumableShardPrice(currentFloor: number, consumableType: ConsumableType) {
  return currentFloor + BASE_CONSUMABLE_PRICES[consumableType];
}
