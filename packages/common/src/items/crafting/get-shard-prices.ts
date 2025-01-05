import { ITEM_LEVEL_SHARD_REWARD_MULTIPLIER } from "../../app-consts.js";
import { ConsumableType } from "../consumables/index.js";
import { Equipment } from "../equipment/index.js";
import { CraftingAction } from "./crafting-actions.js";
import { getShardRewardNumberFromItem } from "./index.js";

export const BASE_CONSUMABLE_PRICES: Record<ConsumableType, number> = {
  [ConsumableType.HpAutoinjector]: 10,
  [ConsumableType.MpAutoinjector]: 10,
  [ConsumableType.StackOfShards]: 0,
};

export function getConsumableShardPrice(currentFloor: number, consumableType: ConsumableType) {
  return Math.max(0, currentFloor - 1) + BASE_CONSUMABLE_PRICES[consumableType];
}

export const BASE_CRAFTING_ACTION_MULTIPLIERS: Record<CraftingAction, number> = {
  [CraftingAction.Scrape]: 1,
  [CraftingAction.Imbue]: 0,
  [CraftingAction.Augment]: 0,
  [CraftingAction.Tumble]: 0,
  [CraftingAction.Reform]: 0,
  [CraftingAction.Shake]: 0,
};

export function getCraftingActionPrice(craftingAction: CraftingAction, equipment: Equipment) {
  const itemBaseValue = equipment.itemLevel * ITEM_LEVEL_SHARD_REWARD_MULTIPLIER;
  // const baseCraftingCost = afterItemLevel * DOUBLE_AFFIX_SHARD_REWARD_MULTIPLIER
  // ITEM_LEVEL_SHARD_REWARD_MULTIPLIER = 1.2;
  // const chance
}
