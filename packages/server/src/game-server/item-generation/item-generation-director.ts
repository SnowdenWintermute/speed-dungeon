import { Affixes, Consumable, Equipment, ItemType } from "@speed-dungeon/common";
import { ItemGenerationBuilder, TaggedBaseItem } from "./item-generation-builder";
import { IdGenerator } from "../../singletons";

export class ItemGenerationDirector {
  constructor(public builder: ItemGenerationBuilder) {}
  createItem(
    itemLevel: number,
    idGenerator: IdGenerator,
    options?: {
      forcedBaseItemOption?: TaggedBaseItem;
      noAffixes?: boolean;
    }
  ): Error | Consumable | Equipment {
    const { builder } = this;
    const baseItemResult = builder.buildBaseItem(itemLevel, options?.forcedBaseItemOption);
    if (baseItemResult instanceof Error) return baseItemResult;

    const { type: itemType } = baseItemResult;
    let affixesResult: Error | Affixes | null = null;
    if (!options?.noAffixes && itemType === ItemType.Equipment) {
      affixesResult = builder.buildAffixes(itemLevel, baseItemResult.taggedBaseEquipment);
    }

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
      case ItemType.Equipment:
        const equipmentBaseItemProperties = builder.buildEquipmentBaseItemProperties(
          baseItemResult.taggedBaseEquipment
        );
        if (equipmentBaseItemProperties instanceof Error) return equipmentBaseItemProperties;
        const durabilityResult = builder.buildDurability(baseItemResult.taggedBaseEquipment);
        if (durabilityResult instanceof Error) return durabilityResult;

        const item = new Equipment(
          entityProperties,
          itemLevel,
          requirements,
          equipmentBaseItemProperties,
          durabilityResult
        );
        if (affixes !== null) item.affixes = affixes;

        return item;
      case ItemType.Consumable:
        return new Consumable(
          entityProperties,
          itemLevel,
          requirements,
          baseItemResult.baseItem,
          1
        );
    }
  }
}
