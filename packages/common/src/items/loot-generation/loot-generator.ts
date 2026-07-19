import { IdGenerator } from "../../utility-classes/index.js";
import { RandomNumberGenerationPolicy } from "../../utility-classes/random-number-generation-policy.js";
import { randBetween } from "../../utils/rand-between.js";
import { ArrayUtils } from "../../utils/array-utils.js";
import { ConsumableType } from "../consumables/consumable-types.js";
import { Consumable } from "../consumables/index.js";
import { GuaranteedAffixes } from "../equipment/affixes.js";
import { Equipment } from "../equipment/index.js";
import {
  BASE_ITEMS_BY_EQUIPMENT_TYPE,
  EquipmentBaseItem,
  EquipmentType,
} from "../equipment/equipment-types/index.js";
import { getEquipmentGenerationTemplate } from "../item-creation/equipment-templates/index.js";
import { ItemBuilder } from "../item-creation/item-builder/index.js";
import { EquipmentBuilder } from "../item-creation/item-builder/equipment-builder.js";
import { getNumericEnumValues } from "../../utils/index.js";
import { Item } from "../index.js";
import {
  LootItemLevel,
  LootItemLevelType,
  LootItemSelector,
  LootItemSelectorType,
  MonsterRewardProfile,
} from "./reward-profile.js";

interface EquipmentTypeEntry {
  equipmentType: EquipmentType;
  baseItems: EquipmentBaseItem[];
}

export class LootGenerator {
  private equipmentTypeEntries: EquipmentTypeEntry[];

  constructor(
    private itemBuilder: ItemBuilder,
    private idGenerator: IdGenerator,
    private rngPolicy: RandomNumberGenerationPolicy
  ) {
    this.equipmentTypeEntries = buildEquipmentTypeEntries();
  }

  generateLootFromProfile(
    profile: MonsterRewardProfile,
    floorLevel: number
  ): { equipment: Equipment[]; consumables: Consumable[] } {
    const equipment: Equipment[] = [];
    const consumables: Consumable[] = [];

    for (const rule of profile.drops) {
      const ruleFires = this.rngPolicy.lootDropRuleChance.roll() < rule.chance;
      if (!ruleFires) {
        continue;
      }
      const dropCount = randBetween(
        rule.quantity.min,
        rule.quantity.max,
        this.rngPolicy.lootDropQuantity
      );
      for (let dropIndex = 0; dropIndex < dropCount; dropIndex += 1) {
        const itemLevel = this.resolveLootItemLevel(rule.itemLevel, floorLevel);
        const item = this.generateItemFromSelector(rule.selector, itemLevel);
        if (item instanceof Consumable) {
          consumables.push(item);
        } else if (item instanceof Equipment) {
          equipment.push(item);
        }
      }
    }

    return { equipment, consumables };
  }

  private resolveLootItemLevel(itemLevel: LootItemLevel, floorLevel: number): number {
    switch (itemLevel.type) {
      case LootItemLevelType.FloorBase:
        return Math.max(1, floorLevel);
      case LootItemLevelType.CenteredOnFloor: {
        const rolled = randBetween(
          floorLevel - itemLevel.spread,
          floorLevel + itemLevel.spread,
          this.rngPolicy.lootItemLevelRoll
        );
        return Math.max(1, rolled);
      }
      case LootItemLevelType.FloorPlusOffset:
        return Math.max(1, floorLevel + itemLevel.offset);
    }
  }

  private generateItemFromSelector(selector: LootItemSelector, itemLevel: number): Item {
    switch (selector.type) {
      case LootItemSelectorType.Consumable:
        return this.generateConsumable(selector.consumableTypeWeights);
      case LootItemSelectorType.Equipment:
        return this.generateEquipment(
          itemLevel,
          selector.equipmentTypeWeights,
          selector.guaranteedAffixes
        );
      case LootItemSelectorType.Any: {
        const weighted = [
          { isEquipment: true, weight: selector.categoryWeights.equipment },
          { isEquipment: false, weight: selector.categoryWeights.consumable },
        ];
        const chosen = ArrayUtils.chooseWeighted(weighted, this.rngPolicy.lootItemSelection);
        if (chosen !== undefined && chosen.isEquipment) {
          return this.generateEquipment(itemLevel, selector.equipmentTypeWeights, undefined);
        }
        return this.generateConsumable(selector.consumableTypeWeights);
      }
    }
  }

  private generateEquipment(
    itemLevel: number,
    equipmentTypeWeights: Partial<Record<EquipmentType, number>> | undefined,
    guaranteedAffixes: GuaranteedAffixes | undefined
  ): Item {
    const entry = this.chooseEquipmentTypeEntry(equipmentTypeWeights);
    if (entry === undefined) {
      return this.createFallbackConsumable();
    }

    const validBaseItems = entry.baseItems.filter((baseItem) => {
      const template = getEquipmentGenerationTemplate(baseItem);
      return itemLevel >= template.levelRange.min && itemLevel <= template.levelRange.max;
    });

    const baseItem = ArrayUtils.chooseRandom(validBaseItems, this.rngPolicy.lootItemSelection);
    if (baseItem instanceof Error) {
      return this.createFallbackConsumable();
    }

    return this.buildEquipmentFromBaseItem(baseItem, itemLevel, guaranteedAffixes);
  }

  private generateConsumable(
    consumableTypeWeights: Partial<Record<ConsumableType, number>> | undefined
  ): Consumable {
    if (consumableTypeWeights === undefined) {
      return this.createFallbackConsumable();
    }

    const weighted = getNumericEnumValues(ConsumableType)
      .map((value) => {
        const consumableType = value as ConsumableType;
        return { consumableType, weight: consumableTypeWeights[consumableType] ?? 0 };
      })
      .filter((candidate) => candidate.weight > 0);

    const chosen = ArrayUtils.chooseWeighted(weighted, this.rngPolicy.lootItemSelection);
    if (chosen === undefined) {
      return this.createFallbackConsumable();
    }

    return this.itemBuilder.consumable(chosen.consumableType).build(this.idGenerator);
  }

  private chooseEquipmentTypeEntry(
    equipmentTypeWeights: Partial<Record<EquipmentType, number>> | undefined
  ): EquipmentTypeEntry | undefined {
    if (equipmentTypeWeights === undefined) {
      const entry = ArrayUtils.chooseRandom(
        this.equipmentTypeEntries,
        this.rngPolicy.lootItemSelection
      );
      return entry instanceof Error ? undefined : entry;
    }

    const weighted = this.equipmentTypeEntries
      .map((entry) => ({ entry, weight: equipmentTypeWeights[entry.equipmentType] ?? 0 }))
      .filter((candidate) => candidate.weight > 0);

    const chosen = ArrayUtils.chooseWeighted(weighted, this.rngPolicy.lootItemSelection);
    return chosen === undefined ? undefined : chosen.entry;
  }

  private buildEquipmentFromBaseItem(
    baseItem: EquipmentBaseItem,
    itemLevel: number,
    guaranteedAffixes?: GuaranteedAffixes
  ): Equipment {
    let builder: EquipmentBuilder;

    switch (baseItem.equipmentType) {
      case EquipmentType.OneHandedMeleeWeapon:
        builder = this.itemBuilder.oneHandedMeleeWeapon(baseItem.baseItemType);
        break;
      case EquipmentType.TwoHandedMeleeWeapon:
        builder = this.itemBuilder.twoHandedMeleeWeapon(baseItem.baseItemType);
        break;
      case EquipmentType.TwoHandedRangedWeapon:
        builder = this.itemBuilder.twoHandedRangedWeapon(baseItem.baseItemType);
        break;
      case EquipmentType.BodyArmor:
        builder = this.itemBuilder.bodyArmor(baseItem.baseItemType);
        break;
      case EquipmentType.HeadGear:
        builder = this.itemBuilder.headGear(baseItem.baseItemType);
        break;
      case EquipmentType.Shield:
        builder = this.itemBuilder.shield(baseItem.baseItemType);
        break;
      case EquipmentType.Ring:
        builder = this.itemBuilder.ring();
        break;
      case EquipmentType.Amulet:
        builder = this.itemBuilder.amulet();
        break;
    }

    return builder
      .itemLevel(itemLevel)
      .randomizeAffixes(guaranteedAffixes)
      .randomizeBaseProperties()
      .randomizeDurability()
      .build(this.idGenerator);
  }

  private createFallbackConsumable(): Consumable {
    const type =
      this.rngPolicy.consumableTypeFallback.roll() > 0.3
        ? ConsumableType.HpAutoinjector
        : ConsumableType.MpAutoinjector;
    return this.itemBuilder.consumable(type).build(this.idGenerator);
  }
}

function buildEquipmentTypeEntries(): EquipmentTypeEntry[] {
  const entries: EquipmentTypeEntry[] = [];

  for (const equipmentType of getNumericEnumValues(EquipmentType)) {
    const baseItemEnum = BASE_ITEMS_BY_EQUIPMENT_TYPE[equipmentType as EquipmentType];
    const baseItems: EquipmentBaseItem[] = [];

    for (const baseItemType of getNumericEnumValues(baseItemEnum)) {
      baseItems.push({
        equipmentType,
        baseItemType,
      } as EquipmentBaseItem);
    }

    if (baseItems.length > 0) {
      entries.push({ equipmentType: equipmentType as EquipmentType, baseItems });
    }
  }

  return entries;
}
