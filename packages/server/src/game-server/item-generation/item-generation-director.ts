import {
  ConsumableProperties,
  EquipmentProperties,
  Item,
  ItemPropertiesType,
} from "@speed-dungeon/common";
import { IdGenerator } from "@speed-dungeon/common";
import { ItemGenerationBuilder } from "./item-generation-builder";

export class ItemGenerationDirector {
  constructor(public builder: ItemGenerationBuilder) {}
  createItem(itemLevel: number, idGenerator: IdGenerator): Error | Item {
    const { builder } = this;
    const { type: itemType, baseItem } = builder.buildBaseItem();
    const affixes = builder.buildAffixes(baseItem);
    const requirements = builder.buildRequirements(baseItem, affixes);
    const name = builder.buildItemName(baseItem, affixes);

    const entityProperties = {
      id: idGenerator.getNextEntityId(),
      name,
    };

    switch (itemType) {
      case ItemPropertiesType.Equipment:
        const equipmentBaseItemProperties = builder.buildEquipmentBaseItemProperties(
          baseItem.baseEquipmentItem
        );
        if (equipmentBaseItemProperties instanceof Error) return equipmentBaseItemProperties;
        const durability = builder.buildDurability(baseItem);

        return new Item(entityProperties, itemLevel, requirements, {
          type: itemType,
          equipmentProperties: new EquipmentProperties(
            baseItem.baseEquipmentItem,
            equipmentBaseItemProperties,
            durability
          ),
        });
      case ItemPropertiesType.Consumable:
        return new Item(entityProperties, itemLevel, requirements, {
          type: itemType,
          consumableProperties: new ConsumableProperties(baseItem, 1),
        });
    }
  }
}
