import {
  AffixType,
  ArmorCategory,
  BodyArmor,
  CombatAttribute,
  EquipmentProperties,
  EquipmentTraitType,
  EquipmentType,
  HpChangeSource,
  HpChangeSourceCategory,
  Item,
  ItemPropertiesType,
  MaxAndCurrent,
  MeleeOrRanged,
  NumberRange,
  OneHandedMeleeWeapon,
  PrefixType,
  SuffixType,
} from "@speed-dungeon/common";
import { idGenerator } from "../../singletons.js";

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
    combatAttributes: { [CombatAttribute.Hp]: 4 },
    equipmentTraits: {},
    tier: 1,
  },
};
TEST_ARMOR_EQUIPMENT_PROPERTIES.affixes[AffixType.Prefix] = {
  [PrefixType.Mp]: {
    combatAttributes: { [CombatAttribute.Mp]: 4 },
    equipmentTraits: {},
    tier: 1,
  },
};

export const HP_ARMOR_TEST_ITEM = new Item(
  { id: idGenerator.generate(), name: "hp armor less" },
  0,
  {},
  {
    type: ItemPropertiesType.Equipment,
    equipmentProperties: TEST_ARMOR_EQUIPMENT_PROPERTIES,
  }
);

const TEST_WEAPON_EQUIPMENT_PROPERTIES = new EquipmentProperties(
  {
    type: EquipmentType.OneHandedMeleeWeapon,
    baseItem: OneHandedMeleeWeapon.ButterKnife,
    damageClassification: [
      new HpChangeSource(HpChangeSourceCategory.Physical, MeleeOrRanged.Melee),
    ],
    damage: new NumberRange(1, 4),
  },
  new MaxAndCurrent(1, 1)
);
TEST_WEAPON_EQUIPMENT_PROPERTIES.affixes[AffixType.Suffix] = {
  [SuffixType.Damage]: {
    combatAttributes: {},
    equipmentTraits: {
      [EquipmentTraitType.FlatDamageAdditive]: {
        equipmentTraitType: EquipmentTraitType.FlatDamageAdditive,
        value: 10,
      },
    },
    tier: 1,
  },
};
TEST_WEAPON_EQUIPMENT_PROPERTIES.affixes[AffixType.Prefix] = {
  [PrefixType.Mp]: {
    combatAttributes: { [CombatAttribute.Mp]: 4 },
    equipmentTraits: {},
    tier: 1,
  },
  [PrefixType.LifeSteal]: {
    combatAttributes: {},
    equipmentTraits: {
      [EquipmentTraitType.LifeSteal]: {
        equipmentTraitType: EquipmentTraitType.LifeSteal,
        value: 50,
      },
    },
    tier: 10,
  },
  [PrefixType.PercentDamage]: {
    combatAttributes: {},
    equipmentTraits: {
      [EquipmentTraitType.DamagePercentage]: {
        equipmentTraitType: EquipmentTraitType.DamagePercentage,
        value: 50,
      },
    },
    tier: 1,
  },
};

export const WEAPON_TEST_ITEM = new Item(
  { id: idGenerator.generate(), name: "the damager" },
  0,
  {},
  {
    type: ItemPropertiesType.Equipment,
    equipmentProperties: TEST_WEAPON_EQUIPMENT_PROPERTIES,
  }
);
