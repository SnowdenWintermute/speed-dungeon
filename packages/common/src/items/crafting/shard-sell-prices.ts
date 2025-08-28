import { Item } from "..";
import {
  BASE_CHANCE_FOR_ITEM_TO_BE_MAGICAL,
  CHANCE_TO_HAVE_DOUBLE_AFFIX,
  CHANCE_TO_HAVE_PREFIX,
  CHANCE_TO_HAVE_SUFFIX,
} from "../../app-consts.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { Consumable, ConsumableType } from "../consumables/index.js";
import { Equipment } from "../equipment/index.js";
import {
  BASE_CONSUMABLE_PRICES,
  DEPRECIATION,
  DURABILITY_PRICE_MODIFIER_WEIGHT,
  EXPONENTIAL_RATE_SELL,
  EXPONENTIAL_WEIGHT_SELL,
  LINEAR_STEP_SELL,
} from "./craft-action-prices.js";

const SUFFIX_CHANCE_BEFORE_MAGICAL = BASE_CHANCE_FOR_ITEM_TO_BE_MAGICAL * CHANCE_TO_HAVE_SUFFIX;
const PREFIX_CHANCE_BEFORE_MAGICAL = BASE_CHANCE_FOR_ITEM_TO_BE_MAGICAL * CHANCE_TO_HAVE_PREFIX;
const BOTH_CHANCE_BEFORE_MAGICAL = BASE_CHANCE_FOR_ITEM_TO_BE_MAGICAL * CHANCE_TO_HAVE_DOUBLE_AFFIX;

export function getBaseItemShardValue(item: Item) {
  return Math.floor(
    LINEAR_STEP_SELL * item.itemLevel +
      EXPONENTIAL_WEIGHT_SELL * Math.pow(item.itemLevel, EXPONENTIAL_RATE_SELL)
  );
}

export function getEquipmentBaseValue(equipment: Equipment) {
  const hasSuffix = Equipment.hasSuffix(equipment);
  const hasPrefix = Equipment.hasPrefix(equipment);

  let modifier = 1;
  if (hasSuffix && hasPrefix) modifier = BOTH_CHANCE_BEFORE_MAGICAL;
  else if (hasPrefix) modifier = PREFIX_CHANCE_BEFORE_MAGICAL;
  else if (hasSuffix) modifier = SUFFIX_CHANCE_BEFORE_MAGICAL;

  return getBaseItemShardValue(equipment) * (1 + (1 - modifier));
}

export function getItemSellPrice(item: Item) {
  if (item instanceof Equipment) return getEquipmentSellPrice(item);
  if (item instanceof Consumable) return getConsumableSellPrice(item.consumableType);
  throw new Error(ERROR_MESSAGES.ITEM.INVALID_TYPE);
}

export function getConsumableSellPrice(consumableType: ConsumableType) {
  const basePriceOption = BASE_CONSUMABLE_PRICES[consumableType];
  if (basePriceOption === null) return 0;
  return Math.floor(basePriceOption * DEPRECIATION);
}

export function getEquipmentSellPrice(equipment: Equipment) {
  const baseValue = getEquipmentBaseValue(equipment);
  // take depreciation
  const afterDepreciation = baseValue * DEPRECIATION;
  // take missing dura
  const normalizedPercentRepaired = Equipment.getNormalizedPercentRepaired(equipment);
  const durabilityModifier = 1 - (1 - normalizedPercentRepaired) * DURABILITY_PRICE_MODIFIER_WEIGHT;
  return Math.floor(afterDepreciation * durabilityModifier);
}
