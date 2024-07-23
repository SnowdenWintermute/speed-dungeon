import {
  ConsumableProperties,
  EquipmentProperties,
  Item,
  ItemPropertiesType,
} from "@speed-dungeon/common";
import { IdGenerator } from "@speed-dungeon/common";
import { ItemGenerationBuilder, TaggedBaseItem } from "./item-generation-builder";

export class ItemGenerationDirector {
  constructor(public builder: ItemGenerationBuilder) {}
  createItem(
    itemLevel: number,
    idGenerator: IdGenerator,
    forcedBaseItemOption?: undefined | TaggedBaseItem
  ): Error | Item {
    const { builder } = this;
    const baseItemResult = builder.buildBaseItem(forcedBaseItemOption);
    if (baseItemResult instanceof Error) return baseItemResult;
    const { type: itemType, baseItem } = baseItemResult;
    const affixesResult =
      itemType === ItemPropertiesType.Equipment ? builder.buildAffixes(baseItem) : null;
    if (affixesResult instanceof Error) return affixesResult;
    const affixes = affixesResult;
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

        const equipmentProperties = new EquipmentProperties(
          baseItem,
          equipmentBaseItemProperties,
          durabilityResult
        );

        if (affixes !== null) equipmentProperties.affixes = affixes;

        const item = new Item(entityProperties, itemLevel, requirements, {
          type: itemType,
          equipmentProperties,
        });

        return item;
      case ItemPropertiesType.Consumable:
        return new Item(entityProperties, itemLevel, requirements, {
          type: itemType,
          consumableProperties: new ConsumableProperties(baseItem, 1),
        });
    }
  }
}
