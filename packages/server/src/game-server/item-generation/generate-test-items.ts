import {
  BASE_ITEMS_BY_EQUIPMENT_TYPE,
  CombatantProperties,
  DEEPEST_FLOOR,
  EquipmentBaseItem,
  EquipmentType,
  Item,
  ItemPropertiesType,
  Shield,
  iterateNumericEnum,
  randBetween,
} from "@speed-dungeon/common";
import { getGameServer, idGenerator } from "../../singletons.js";

export default function generateTestItems(combatantProperties: CombatantProperties, num: number) {
  for (let i = 0; i < num; i += 1) {
    const iLvl = randBetween(1, DEEPEST_FLOOR);
    const randomItem = getGameServer().generateRandomItem(1);
    if (!(randomItem instanceof Error)) combatantProperties.inventory.items.push(randomItem);
  }
}

export function generateSpecificEquipmentType(
  equipmentBaseItem: EquipmentBaseItem,
  noAffixes?: boolean
) {
  const itemGenerationDirector =
    getGameServer().itemGenerationDirectors[equipmentBaseItem.equipmentType];
  const item = itemGenerationDirector?.createItem(1, idGenerator, {
    forcedBaseItemOption: {
      type: ItemPropertiesType.Equipment,
      baseItem: equipmentBaseItem,
    },
    noAffixes,
  });
  return item;
}

export function generateOneOfEachItem() {
  const items: Item[] = [];

  for (const [equipmentTypeString, baseItemEnum] of Object.entries(
    BASE_ITEMS_BY_EQUIPMENT_TYPE
  ).sort((a, b) => parseInt(a[0]) - parseInt(b[0]))) {
    const equipmentType = parseInt(equipmentTypeString) as EquipmentType;
    if (
      ![
        // EquipmentType.OneHandedMeleeWeapon,
        EquipmentType.TwoHandedMeleeWeapon,
        EquipmentType.TwoHandedRangedWeapon,
        // EquipmentType.Shield,
      ].includes(equipmentType)
    )
      continue;

    for (const baseItemString of iterateNumericEnum(baseItemEnum)) {
      const baseItem = parseInt(baseItemString);
      const item = generateSpecificEquipmentType({
        equipmentType: equipmentType,
        baseItemType: baseItem,
      });
      if (item instanceof Error || item === undefined) {
        console.error("forced item type not generated:", item);
        continue;
      }
      items.push(item);
    }
  }
  return items;
}
