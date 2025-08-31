import {
  BASE_ITEMS_BY_EQUIPMENT_TYPE,
  CombatantProperties,
  DEEPEST_FLOOR,
  Equipment,
  EquipmentBaseItem,
  EquipmentType,
  Inventory,
  Item,
  ItemType,
  NumberRange,
  iterateNumericEnum,
  randBetween,
} from "@speed-dungeon/common";
import { getGameServer, idGenerator, rngSingleton } from "../../singletons/index.js";

export default function generateTestItems(combatantProperties: CombatantProperties, num: number) {
  for (let i = 0; i < num; i += 1) {
    const iLvl = randBetween(1, DEEPEST_FLOOR, rngSingleton);
    const randomItem = getGameServer().generateRandomItem(1);
    if (randomItem instanceof Error) return console.error(randomItem);
    Inventory.insertItem(combatantProperties.inventory, randomItem);
  }
}

export function generateSpecificEquipmentType(
  equipmentBaseItem: EquipmentBaseItem,
  options: {
    noAffixes?: boolean;
    itemLevel?: number;
  }
) {
  const { noAffixes, itemLevel } = options;
  const itemGenerationDirector =
    getGameServer().itemGenerationDirectors[equipmentBaseItem.equipmentType];
  const item = itemGenerationDirector?.createItem(itemLevel || 1, idGenerator, {
    forcedBaseItemOption: {
      type: ItemType.Equipment,
      taggedBaseEquipment: equipmentBaseItem,
    },
    noAffixes,
  });

  if (!(item instanceof Equipment)) throw new Error("invalid item type created");

  return item;
}

export function generateOneOfEachItem(ilvlRange: NumberRange) {
  const items: Item[] = [];

  for (const [equipmentTypeString, baseItemEnum] of Object.entries(
    BASE_ITEMS_BY_EQUIPMENT_TYPE
  ).sort((a, b) => parseInt(a[0]) - parseInt(b[0]))) {
    const equipmentType = parseInt(equipmentTypeString) as EquipmentType;
    if (
      ![
        EquipmentType.BodyArmor,
        EquipmentType.Shield,
        EquipmentType.OneHandedMeleeWeapon,
        EquipmentType.TwoHandedMeleeWeapon,
        EquipmentType.TwoHandedRangedWeapon,
      ].includes(equipmentType)
    )
      continue;

    for (const baseItemString of iterateNumericEnum(baseItemEnum)) {
      const baseItem = parseInt(baseItemString);
      const ilvl = randBetween(ilvlRange.min, ilvlRange.max, rngSingleton);
      const item = generateSpecificEquipmentType(
        {
          equipmentType: equipmentType,
          baseItemType: baseItem,
        },
        { itemLevel: ilvl }
      );
      if (item instanceof Error || item === undefined) {
        console.error("forced item type not generated:", item);
        continue;
      }
      items.push(item);
    }
  }
  return items;
}
