import { Item } from "../index.js";
import {
  Combatant,
  CombatantEquipment,
  CombatantProperties,
  CombatantTraitType,
  Inventory,
} from "../../combatants/index.js";
import { EntityId } from "../../primatives/index.js";
import { DungeonRoomType } from "../../adventuring-party/dungeon-room.js";
import { getItemSellPrice } from "./shard-sell-prices.js";
import { ArrayUtils } from "../../utils/array-utils.js";

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
  const equippedItems = CombatantEquipment.getAllEquippedItems(combatantProperties.equipment, {
    includeUnselectedHotswapSlots: true,
  });

  if (itemIds.length === 0) return;
  for (const item of itemsInInventory.concat(equippedItems)) {
    if (!itemIds.includes(item.entityProperties.id)) continue;
    const shardsResult = convertItemToShards(item, combatantProperties);
    if (shardsResult instanceof Error) return shardsResult;
    combatantProperties.inventory.shards += shardsResult;
    ArrayUtils.removeElement(itemIds, item.entityProperties.id);
    if (itemIds.length === 0) break;
  }
}

function convertItemToShards(item: Item, combatantProperties: CombatantProperties) {
  const itemId = item.entityProperties.id;
  const removedItemResult = CombatantProperties.removeOwnedItem(combatantProperties, itemId);
  if (removedItemResult instanceof Error) return removedItemResult;
  return getItemSellPrice(removedItemResult);
}
