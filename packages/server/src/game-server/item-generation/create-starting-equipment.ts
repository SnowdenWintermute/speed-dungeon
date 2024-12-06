import {
  AffixType,
  ArmorCategory,
  BodyArmor,
  CombatAttribute,
  CombatantClass,
  EquipmentProperties,
  EquipmentSlot,
  EquipmentType,
  Item,
  ItemPropertiesType,
  MaxAndCurrent,
  OneHandedMeleeWeapon,
  PrefixType,
  Shield,
  SuffixType,
  TwoHandedMeleeWeapon,
} from "@speed-dungeon/common";
import { generateSpecificEquipmentType } from "./generate-test-items.js";
import { idGenerator } from "../../singletons.js";

export default function createStartingEquipment(combatantClass: CombatantClass) {
  const startingEquipment: Partial<Record<EquipmentSlot, Item>> = {};

  let mainhand: Item | Error | undefined, offhand: Item | Error | undefined;
  switch (combatantClass) {
    case CombatantClass.Warrior:
      mainhand = generateSpecificEquipmentType(
        {
          equipmentType: EquipmentType.OneHandedMeleeWeapon,
          baseItemType: OneHandedMeleeWeapon.RuneSword,
        },
        true
      );
      offhand = generateSpecificEquipmentType(
        { equipmentType: EquipmentType.Shield, baseItemType: Shield.PotLid },
        true
      );
      // startingEquipment[EquipmentSlot.MainHand]
      break;
    case CombatantClass.Mage:
      mainhand = generateSpecificEquipmentType(
        {
          equipmentType: EquipmentType.OneHandedMeleeWeapon,
          baseItemType: OneHandedMeleeWeapon.EtherBlade,
        },
        true
      );
      break;
    case CombatantClass.Rogue:
      mainhand = generateSpecificEquipmentType(
        {
          equipmentType: EquipmentType.TwoHandedMeleeWeapon,
          baseItemType: TwoHandedMeleeWeapon.Trident,
        },
        true
      );
      // offhand = generateSpecificEquipmentType(
      //   {
      //     equipmentType: EquipmentType.OneHandedMeleeWeapon,
      //     baseItemType: OneHandedMeleeWeapon.RuneSword,
      //   },
      //   true
      // );
      break;
  }

  if (mainhand instanceof Error) return mainhand;
  if (offhand instanceof Error) return offhand;

  if (mainhand) startingEquipment[EquipmentSlot.MainHand] = mainhand;
  if (offhand) startingEquipment[EquipmentSlot.OffHand] = offhand;

  const TEST_ARMOR_EQUIPMENT_PROPERTIES = new EquipmentProperties(
    {
      type: EquipmentType.BodyArmor,
      baseItem: BodyArmor.GothicPlate,
      armorClass: 1,
      armorCategory: ArmorCategory.Plate,
    },
    new MaxAndCurrent(1, 1)
  );

  TEST_ARMOR_EQUIPMENT_PROPERTIES.affixes[AffixType.Suffix] = {
    [SuffixType.Hp]: {
      combatAttributes: { [CombatAttribute.Hp]: 10 },
      equipmentTraits: {},
      tier: 1,
    },
  };
  TEST_ARMOR_EQUIPMENT_PROPERTIES.affixes[AffixType.Prefix] = {
    [PrefixType.Mp]: {
      combatAttributes: { [CombatAttribute.Mp]: 10 },
      equipmentTraits: {},
      tier: 1,
    },
  };

  const HP_ARMOR_TEST_ITEM = new Item(
    { id: idGenerator.generate(), name: "hp armor" },
    0,
    {},
    {
      type: ItemPropertiesType.Equipment,
      equipmentProperties: TEST_ARMOR_EQUIPMENT_PROPERTIES,
    }
  );

  startingEquipment[EquipmentSlot.Body] = HP_ARMOR_TEST_ITEM;

  return startingEquipment;
}
