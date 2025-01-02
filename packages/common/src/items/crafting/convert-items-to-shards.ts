import { Item } from "..";
import {
  DOUBLE_AFFIX_SHARD_REWARD_MULTIPLIER,
  ITEM_LEVEL_SHARD_REWARD_MULTIPLIER,
  PREFIX_SHARD_REWARD_MULTIPLIER,
  SUFFIX_SHARD_REWARD_MULTIPLIER,
} from "../../app-consts";
import { Combatant, CombatantEquipment, Inventory } from "../../combatants";
import { EntityId } from "../../primatives";
import { AffixType, Equipment } from "../equipment";

export function convertItemsToShards(itemIds: EntityId[], combatant: Combatant) {
  const { combatantProperties } = combatant;
  // COMMON
  // find the owned item
  // get the item to shard ratio
  // remove the item from combatant inventory
  // add the correct number of shards to their inventory
  const itemsInInventory = Inventory.getItems(combatantProperties.inventory);
  const equippedItems = CombatantEquipment.getAllEquippedItems(combatantProperties);

  if (itemIds.length > 0)
    for (const item of itemsInInventory) {
      if (itemIds.includes(item.entityProperties.id)) {
        // shard this
        // remove from itemIds list
        // break out of loop if itemIds is empty
      }
    }

  if (itemIds.length > 0)
    for (const item of equippedItems) {
      if (itemIds.includes(item.entityProperties.id)) {
        // shard this
        // remove from itemIds list
        // break out of loop if itemIds is empty
      }
    }
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
