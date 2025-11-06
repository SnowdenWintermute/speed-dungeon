import { Consumable, ConsumableType } from "./consumables/index.js";
import { Equipment } from "./equipment/index.js";
import { Item } from "./index.js";

export class ItemUtils {
  static sortIntoStacks(items: Item[]) {
    const equipmentAndShardStacks: Item[] = [];
    const consumablesByTypeAndLevel: Partial<Record<ConsumableType, Record<number, Consumable[]>>> =
      {};

    for (const item of items) {
      const isEquipment = item instanceof Equipment;
      const isConsumable = item instanceof Consumable;
      const isShardStack = isConsumable && item.consumableType === ConsumableType.StackOfShards;
      const shouldNotStack = isEquipment || isShardStack;

      if (shouldNotStack) equipmentAndShardStacks.push(item);
      else if (isConsumable) {
        const { consumableType } = item;
        const existingConsumableTypeLevelStacks = consumablesByTypeAndLevel[consumableType];

        if (!existingConsumableTypeLevelStacks)
          consumablesByTypeAndLevel[consumableType] = { [item.itemLevel]: [item] };
        else {
          const existingLevelStackOption = existingConsumableTypeLevelStacks[item.itemLevel];
          if (existingLevelStackOption) existingLevelStackOption.push(item);
          else existingConsumableTypeLevelStacks[item.itemLevel] = [item];
        }
      }
    }

    return { equipmentAndShardStacks, consumablesByTypeAndLevel };
  }
}
