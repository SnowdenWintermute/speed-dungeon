import { ConsumableProperties, EquipmentProperties, Item, ItemPropertiesType } from "../..";
import { IdGenerator } from "../../../game/id_generator";
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

// what is dropped
//   - consumable
//   - equipment
//   - nothing

// base item
//  - consumables: choose from list of consumables
//  - equipment:
//    - choose from list of equipment categories
//    - choose base item in that category

// rarity
//  - consumables are never rare
//  - roll percentage chance for equipment

// base item properties
//  - consumables: null or noop
//  - equipment:
//    - all equipment:
//      - durability
//    - weapons:
//      - min/max damage
//      - damage types (ranged(evadable, element), melee(evadable, element), magical(evadable, element)
//    - armor:
//      - armor class
//      - armor type
//    - shield:
//      - armor class
//      - shield size

// affixes
//  - consumables null/noop
//  - equipment:
//    - prefix, suffix or both
//    - select affixes permitted by category and base item
//    - roll affix tiers based on item level
//    - roll affix values within tier min/max

// name item
//  - consumable: default name
//  - equipment x base item of x
