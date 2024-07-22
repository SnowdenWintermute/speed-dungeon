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
    const baseItemResult = builder.buildBaseItem();
    if (baseItemResult instanceof Error) return baseItemResult;
    const { type: itemType, baseItem } = baseItemResult;
    const affixes =
      itemType === ItemPropertiesType.Equipment ? builder.buildAffixes(baseItem) : null;
    const requirements = builder.buildRequirements(baseItemResult, affixes);
    const name = builder.buildItemName(baseItemResult, affixes);

    const entityProperties = {
      id: idGenerator.getNextEntityId(),
      name,
    };

    switch (itemType) {
      case ItemPropertiesType.Equipment:
        const equipmentBaseItemProperties = builder.buildEquipmentBaseItemProperties(baseItem);
        if (equipmentBaseItemProperties instanceof Error) return equipmentBaseItemProperties;
        const durabilityResult = builder.buildDurability(baseItem);
        if (durabilityResult instanceof Error) return durabilityResult;

        return new Item(entityProperties, itemLevel, requirements, {
          type: itemType,
          equipmentProperties: new EquipmentProperties(
            baseItem,
            equipmentBaseItemProperties,
            durabilityResult
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
