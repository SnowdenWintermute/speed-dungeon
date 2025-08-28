import {
  CHANCE_TO_HAVE_DOUBLE_AFFIX,
  CHANCE_TO_HAVE_PREFIX,
  CHANCE_TO_HAVE_SUFFIX,
} from "../../app-consts.js";
import { ConsumableType } from "../consumables/index.js";
import { Equipment } from "../equipment/index.js";
import { CraftingAction } from "./crafting-actions.js";
import { getEquipmentBaseValue } from "./shard-sell-prices.js";

export const BASE_CONSUMABLE_PRICES: Record<ConsumableType, null | number> = {
  [ConsumableType.HpAutoinjector]: 10,
  [ConsumableType.MpAutoinjector]: 10,
  [ConsumableType.StackOfShards]: null,
  [ConsumableType.WarriorSkillbook]: null,
  [ConsumableType.RogueSkillbook]: null,
  [ConsumableType.MageSkillbook]: null,
};

export function getConsumableShardPrice(currentFloor: number, consumableType: ConsumableType) {
  const basePriceOption = BASE_CONSUMABLE_PRICES[consumableType];
  if (basePriceOption === null) return null;
  return Math.max(0, currentFloor - 1) + basePriceOption;
}

export const EXPONENTIAL_RATE_SELL = 1.2;
export const EXPONENTIAL_RATE_CRAFT = 1.5;
export const EXPONENTIAL_WEIGHT_SELL = 1.1;
export const EXPONENTIAL_WEIGHT_CRAFT = 1.15;
export const LINEAR_STEP_SELL = 1;
export const LINEAR_STEP_CRAFT = 1.1;

// selling items should give less than the "full value" of the item
export const DEPRECIATION = 0.9;
// the extent to which missing duraility reduces sell price
export const DURABILITY_PRICE_MODIFIER_WEIGHT = 0.4;

export const IMBUE_COST_MULTIPLIER = 0.5;
export const AUGMENT_COST_MULTIPLIER = 3;
export const SHAKE_COST_MULTIPLIER = 5;

export const BROKEN_ITEM_REPAIR_COST_MULTIPLIER = 4;

function getBaseCraftingCost(itemLevel: number) {
  return (
    LINEAR_STEP_CRAFT * itemLevel +
    EXPONENTIAL_WEIGHT_CRAFT * Math.pow(itemLevel, EXPONENTIAL_RATE_CRAFT)
  );
}

export const CRAFTING_ACTION_PRICE_CALCULATORS: Record<
  CraftingAction,
  (equipment: Equipment) => number
> = {
  [CraftingAction.Repair]: (equipment: Equipment) => {
    const baseValue = getEquipmentBaseValue(equipment);
    const normalizedPercentRepaired = Equipment.getNormalizedPercentRepaired(equipment);
    const baseRepairCost = baseValue - baseValue * normalizedPercentRepaired;
    if (equipment.durability?.current === 0)
      return baseRepairCost * BROKEN_ITEM_REPAIR_COST_MULTIPLIER;
    return baseRepairCost;
  },
  [CraftingAction.Imbue]: (equipment: Equipment) =>
    getBaseCraftingCost(equipment.itemLevel) * IMBUE_COST_MULTIPLIER,
  [CraftingAction.Augment]: (equipment: Equipment) =>
    getBaseCraftingCost(equipment.itemLevel) * AUGMENT_COST_MULTIPLIER,
  [CraftingAction.Tumble]: (equipment: Equipment) => getBaseCraftingCost(equipment.itemLevel),
  [CraftingAction.Reform]: (equipment: Equipment) => {
    let cost = getBaseCraftingCost(equipment.itemLevel);
    const hasSuffix = Equipment.hasSuffix(equipment);
    const hasPrefix = Equipment.hasPrefix(equipment);
    if (hasSuffix && hasPrefix) cost *= 1 + (1 - CHANCE_TO_HAVE_DOUBLE_AFFIX);
    else if (hasPrefix) cost *= 1 + (1 - CHANCE_TO_HAVE_PREFIX);
    else if (hasSuffix) cost *= 1 + (1 - CHANCE_TO_HAVE_SUFFIX);
    return cost;
  },
  [CraftingAction.Shake]: (equipment: Equipment) =>
    getBaseCraftingCost(equipment.itemLevel) * SHAKE_COST_MULTIPLIER,
};

export function getCraftingActionPrice(craftingAction: CraftingAction, equipment: Equipment) {
  return Math.max(1, Math.floor(CRAFTING_ACTION_PRICE_CALCULATORS[craftingAction](equipment)));
}
