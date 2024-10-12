import {
  ConsumableProperties,
  EquipmentProperties,
  Item,
  ItemPropertiesType,
} from "@speed-dungeon/common";
import { ItemGenerationBuilder, TaggedBaseItem } from "./item-generation-builder";
import { IdGenerator } from "../../singletons";

export class ItemGenerationDirector {
  constructor(public builder: ItemGenerationBuilder) {}
  createItem(
    itemLevel: number,
    idGenerator: IdGenerator,
    forcedBaseItemOption?: undefined | TaggedBaseItem
  ): Error | Item {
    const { builder } = this;
    const baseItemResult = builder.buildBaseItem(itemLevel, forcedBaseItemOption);
    if (baseItemResult instanceof Error) return baseItemResult;
    const { type: itemType, baseItem } = baseItemResult;
    const affixesResult =
      itemType === ItemPropertiesType.Equipment ? builder.buildAffixes(itemLevel, baseItem) : null;
    if (affixesResult instanceof Error) return affixesResult;
    const affixes = affixesResult;
    const requirementsResult = builder.buildRequirements(baseItemResult, affixes);
    if (requirementsResult instanceof Error) return requirementsResult;
    const requirements = requirementsResult;
    const name = builder.buildItemName(baseItemResult, affixes);

    const entityProperties = {
      id: idGenerator.generate(),
      name,
    };

    switch (itemType) {
      case ItemPropertiesType.Equipment:
        const equipmentBaseItemProperties = builder.buildEquipmentBaseItemProperties(baseItem);
        if (equipmentBaseItemProperties instanceof Error) return equipmentBaseItemProperties;
        const durabilityResult = builder.buildDurability(baseItem);
        if (durabilityResult instanceof Error) return durabilityResult;

        const equipmentProperties = new EquipmentProperties(
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
