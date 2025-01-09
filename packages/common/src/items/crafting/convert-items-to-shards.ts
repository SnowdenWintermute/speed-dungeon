import { Item } from "../index.js";
import {
  AFFIX_TIER_SHARD_REWARD_MULTIPLIER,
  DOUBLE_AFFIX_SHARD_REWARD_MULTIPLIER,
  ITEM_LEVEL_SHARD_REWARD_MULTIPLIER,
  PREFIX_SHARD_REWARD_MULTIPLIER,
  SUFFIX_SHARD_REWARD_MULTIPLIER,
} from "../../app-consts.js";
import {
  Combatant,
  CombatantEquipment,
  CombatantProperties,
  CombatantTraitType,
  Inventory,
} from "../../combatants/index.js";
import { EntityId } from "../../primatives/index.js";
import { removeFromArray } from "../../utils/index.js";
import { AffixType, Equipment } from "../equipment/index.js";
import { DungeonRoomType } from "../../adventuring-party/dungeon-room.js";

export function combatantIsAllowedToConvertItemsToShards(
  combatantProperties: CombatantProperties,
  currentRoomType: DungeonRoomType
) {
  return (
    currentRoomType === DungeonRoomType.VendingMachine ||
    CombatantProperties.hasTraitType(
      combatantProperties,
      CombatantTraitType.CanConvertToShardsManually
    )
  );
}

export function convertItemsToShards(itemIds: EntityId[], combatant: Combatant) {
  const { combatantProperties } = combatant;
  const itemsInInventory = Inventory.getItems(combatantProperties.inventory);
  const equippedItems = CombatantEquipment.getAllEquippedItems(combatantProperties, {
    includeUnselectedHotswapSlots: true,
  });

  if (itemIds.length === 0) return;
  for (const item of itemsInInventory.concat(equippedItems)) {
    if (!itemIds.includes(item.entityProperties.id)) continue;
    const shardsResult = convertItemToShards(item, combatantProperties);
    if (shardsResult instanceof Error) return shardsResult;
    combatantProperties.inventory.shards += shardsResult;
    removeFromArray(itemIds, item.entityProperties.id);
    if (itemIds.length === 0) break;
  }
}

function convertItemToShards(item: Item, combatantProperties: CombatantProperties) {
  const itemId = item.entityProperties.id;
  const removedItemResult = Inventory.removeItem(combatantProperties.inventory, itemId);
  if (!(removedItemResult instanceof Error)) return getShardRewardNumberFromItem(removedItemResult);
  const removedEquipmentResult = CombatantEquipment.removeItem(combatantProperties, itemId);
  if (!(removedEquipmentResult instanceof Error))
    return getShardRewardNumberFromItem(removedEquipmentResult);

  return new Error("Error converting item to shards");
}

export function getShardRewardNumberFromItem(item: Item) {
  const afterItemLevel = item.itemLevel * ITEM_LEVEL_SHARD_REWARD_MULTIPLIER;
  if (!(item instanceof Equipment)) return Math.floor(afterItemLevel);
  let suffixTier = 0;
  const suffixOption = Object.values(item.affixes[AffixType.Suffix])[0];
  if (suffixOption) suffixTier = suffixOption.tier;
  let prefixTier = 0;
  const prefixOption = Object.values(item.affixes[AffixType.Prefix])[0];
  if (prefixOption) prefixTier = prefixOption.tier;

  if (!suffixTier && !prefixTier) return Math.max(1, Math.floor(afterItemLevel));

  const suffixBaseShardValue =
    suffixTier * AFFIX_TIER_SHARD_REWARD_MULTIPLIER * SUFFIX_SHARD_REWARD_MULTIPLIER;
  const prefixBaseShardValue =
    suffixTier * AFFIX_TIER_SHARD_REWARD_MULTIPLIER * SUFFIX_SHARD_REWARD_MULTIPLIER;
  const combinedValue = afterItemLevel + suffixBaseShardValue + prefixBaseShardValue;
  return Math.max(1, Math.floor(combinedValue));
}
