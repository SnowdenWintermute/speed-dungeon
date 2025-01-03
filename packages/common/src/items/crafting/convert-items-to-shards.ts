import { Item } from "..";
import {
  DOUBLE_AFFIX_SHARD_REWARD_MULTIPLIER,
  ITEM_LEVEL_SHARD_REWARD_MULTIPLIER,
  PREFIX_SHARD_REWARD_MULTIPLIER,
  SUFFIX_SHARD_REWARD_MULTIPLIER,
} from "../../app-consts";
import { Combatant, CombatantEquipment, Inventory } from "../../combatants";
import { EntityId } from "../../primatives";
import { removeFromArray } from "../../utils";
import { AffixType, Equipment } from "../equipment";

export function convertItemsToShards(itemIds: EntityId[], combatant: Combatant) {
  const { combatantProperties } = combatant;
  const itemsInInventory = Inventory.getItems(combatantProperties.inventory);
  const equippedItems = CombatantEquipment.getAllEquippedItems(combatantProperties);

  if (itemIds.length === 0) return;
  for (const item of itemsInInventory.concat(equippedItems)) {
    if (!itemIds.includes(item.entityProperties.id)) continue;
    const shardsResult = convertItemToShards(item, combatantProperties.inventory);
    if (shardsResult instanceof Error) return shardsResult;
    combatantProperties.inventory.shards += shardsResult;
    removeFromArray(itemIds, item.entityProperties.id);
    if (itemIds.length === 0) break;
  }
}

export function convertItemToShards(item: Item, inventory: Inventory) {
  const removedItemResult = Inventory.removeItem(inventory, item.entityProperties.id);
  if (removedItemResult instanceof Error) return removedItemResult;
  return getShardRewardNumberFromItem(removedItemResult);
}

export function getShardRewardNumberFromItem(item: Item) {
  const afterItemLevel = 1 * ITEM_LEVEL_SHARD_REWARD_MULTIPLIER;
  if (!(item instanceof Equipment)) return afterItemLevel;
  const hasPrefix = Object.values(item.affixes[AffixType.Prefix]).length;
  const hasSuffix = Object.values(item.affixes[AffixType.Suffix]).length;
  if (hasPrefix && hasSuffix)
    return Math.floor(afterItemLevel * DOUBLE_AFFIX_SHARD_REWARD_MULTIPLIER);
  else if (hasSuffix) return Math.floor(afterItemLevel * SUFFIX_SHARD_REWARD_MULTIPLIER);
  else if (hasPrefix) return Math.floor(afterItemLevel * PREFIX_SHARD_REWARD_MULTIPLIER);
  else return afterItemLevel;
}
