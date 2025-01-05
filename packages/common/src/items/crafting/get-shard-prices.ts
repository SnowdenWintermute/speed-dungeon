import {
  CHANCE_TO_HAVE_DOUBLE_AFFIX,
  CHANCE_TO_HAVE_PREFIX,
  CHANCE_TO_HAVE_SUFFIX,
  DOUBLE_AFFIX_SHARD_REWARD_MULTIPLIER,
  ITEM_LEVEL_SHARD_REWARD_MULTIPLIER,
  ITEM_REPAIR_COST_MULTIPLIER,
  PREFIX_SHARD_REWARD_MULTIPLIER,
  SUFFIX_SHARD_REWARD_MULTIPLIER,
} from "../../app-consts.js";
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

const MAGICAL_ITEM_AVG_SHARD_REWARD =
  CHANCE_TO_HAVE_SUFFIX * SUFFIX_SHARD_REWARD_MULTIPLIER +
  CHANCE_TO_HAVE_PREFIX * PREFIX_SHARD_REWARD_MULTIPLIER +
  CHANCE_TO_HAVE_DOUBLE_AFFIX * DOUBLE_AFFIX_SHARD_REWARD_MULTIPLIER;

export const BASE_CRAFTING_ACTION_MULTIPLIERS: Record<CraftingAction, number> = {
  [CraftingAction.Repair]: ITEM_REPAIR_COST_MULTIPLIER,
  [CraftingAction.Imbue]: MAGICAL_ITEM_AVG_SHARD_REWARD,
  [CraftingAction.Augment]: MAGICAL_ITEM_AVG_SHARD_REWARD * 3,
  [CraftingAction.Tumble]: MAGICAL_ITEM_AVG_SHARD_REWARD * 2,
  [CraftingAction.Reform]: MAGICAL_ITEM_AVG_SHARD_REWARD,
  [CraftingAction.Shake]: MAGICAL_ITEM_AVG_SHARD_REWARD * 5,
};

export function getCraftingActionPrice(craftingAction: CraftingAction, equipment: Equipment) {
  const nonMagicalItemValue = equipment.itemLevel * ITEM_LEVEL_SHARD_REWARD_MULTIPLIER;
  const actionPrice = nonMagicalItemValue * BASE_CRAFTING_ACTION_MULTIPLIERS[craftingAction];
  return actionPrice;
}
