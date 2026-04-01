import { IdGenerator } from "../../utility-classes/index.js";
import { RandomNumberGenerator } from "../../utility-classes/randomizers.js";
import { randBetween } from "../../utils/rand-between.js";
import { ArrayUtils } from "../../utils/array-utils.js";
import { ConsumableType } from "../consumables/consumable-types.js";
import { Consumable } from "../consumables/index.js";
import { Equipment } from "../equipment/index.js";
import {
  BASE_ITEMS_BY_EQUIPMENT_TYPE,
  EquipmentBaseItem,
  EquipmentType,
} from "../equipment/equipment-types/index.js";
import { getEquipmentGenerationTemplate } from "./equipment-templates/index.js";
import { ItemBuilder } from "./item-builder/index.js";
import { EquipmentBuilder } from "./item-builder/equipment-builder.js";
import { getNumericEnumValues } from "../../utils/index.js";
import { Item } from "../index.js";

interface EquipmentTypeEntry {
  equipmentType: EquipmentType;
  baseItems: EquipmentBaseItem[];
}

export class LootGenerator {
  private equipmentTypeEntries: EquipmentTypeEntry[];

  constructor(
    private itemBuilder: ItemBuilder,
    private idGenerator: IdGenerator,
    private rng: RandomNumberGenerator
  ) {
    this.equipmentTypeEntries = buildEquipmentTypeEntries();
  }

  generateLoot(
    quantity: number,
    maxItemLevel: number
  ): { equipment: Equipment[]; consumables: Consumable[] } {
    const equipment: Equipment[] = [];
    const consumables: Consumable[] = [];

    for (let i = 0; i < quantity; i += 1) {
      const iLvl = randBetween(1, maxItemLevel, this.rng);
      const item = this.generateRandomItem(iLvl);
      if (item instanceof Consumable) consumables.push(item);
      else if (item instanceof Equipment) equipment.push(item);
    }

    return { equipment, consumables };
  }

  generateRandomItem(itemLevel: number): Item {
    const entry = ArrayUtils.chooseRandom(this.equipmentTypeEntries, this.rng);
    if (entry instanceof Error) {
      return this.createFallbackConsumable();
    }

    const validBaseItems = entry.baseItems.filter((baseItem) => {
      const template = getEquipmentGenerationTemplate(baseItem);
      return itemLevel >= template.levelRange.min && itemLevel <= template.levelRange.max;
    });

    const baseItem = ArrayUtils.chooseRandom(validBaseItems, this.rng);
    if (baseItem instanceof Error) {
      return this.createFallbackConsumable();
    }

    return this.buildEquipmentFromBaseItem(baseItem, itemLevel);
  }

  private buildEquipmentFromBaseItem(baseItem: EquipmentBaseItem, itemLevel: number): Equipment {
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
      .randomizeAffixes()
      .randomizeBaseProperties()
      .randomizeDurability()
      .build(this.idGenerator);
  }

  private createFallbackConsumable(): Consumable {
    const type =
      Math.random() > 0.3 ? ConsumableType.HpAutoinjector : ConsumableType.MpAutoinjector;
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
