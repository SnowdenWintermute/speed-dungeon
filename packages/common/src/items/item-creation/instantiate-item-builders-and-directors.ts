import { RandomNumberGenerator } from "../../utility-classes/randomizers.js";
import { EquipmentBaseItemType, EquipmentType } from "../equipment/equipment-types/index.js";
import { ArmorGenerationBuilder } from "./builders/armor.js";
import { ItemGenerationBuilder } from "./builders/item.js";
import { ItemGenerationDirector } from "./builders/item-generation-director.js";
import { JewelryGenerationBuilder } from "./builders/jewelry.js";
import { ShieldGenerationBuilder } from "./builders/shields.js";
import { WeaponGenerationBuilder } from "./builders/weapons.js";
import {
  BODY_ARMOR_EQUIPMENT_GENERATION_TEMPLATES,
  BodyArmorGenerationTemplate,
} from "./equipment-templates/body-armor.js";
import {
  HEAD_GEAR_EQUIPMENT_GENERATION_TEMPLATES,
  HeadGearGenerationTemplate,
} from "./equipment-templates/head-gear.js";
import {
  AMULET_GENERATION_TEMPLATES,
  JewelryGenerationTemplate,
  RING_GENERATION_TEMPLATES,
} from "./equipment-templates/jewelry.js";
import {
  ONE_HANDED_MELEE_EQUIPMENT_GENERATION_TEMPLATES,
  OneHandedMeleeWeaponGenerationTemplate,
} from "./equipment-templates/one-handed-melee-weapons.js";
import {
  SHIELD_EQUIPMENT_GENERATION_TEMPLATES,
  ShieldGenerationTemplate,
} from "./equipment-templates/shields.js";
import {
  TWO_HANDED_MELEE_EQUIPMENT_GENERATION_TEMPLATES,
  TwoHandedMeleeWeaponGenerationTemplate,
} from "./equipment-templates/two-handed-melee-weapons.js";
import {
  TWO_HANDED_RANGED_EQUIPMENT_GENERATION_TEMPLATES,
  TwoHandedRangedWeaponGenerationTemplate,
} from "./equipment-templates/two-handed-ranged-weapons.js";
import { AffixGenerator } from "./builders/affix-generator/index.js";

export function instantiateItemGenerationBuildersAndDirectors(
  randomNumberGenerator: RandomNumberGenerator,
  affixGenerator: AffixGenerator
): {
  builders: Record<EquipmentType, ItemGenerationBuilder>;
  directors: Record<EquipmentType, ItemGenerationDirector>;
} {
  const oneHandedMeleeWeaponBuilder = new WeaponGenerationBuilder(
    ONE_HANDED_MELEE_EQUIPMENT_GENERATION_TEMPLATES as Record<
      EquipmentBaseItemType,
      OneHandedMeleeWeaponGenerationTemplate
    >,
    EquipmentType.OneHandedMeleeWeapon,
    randomNumberGenerator,
    affixGenerator
  );

  const twoHandedRangedWeaponBuilder = new WeaponGenerationBuilder(
    TWO_HANDED_RANGED_EQUIPMENT_GENERATION_TEMPLATES as Record<
      EquipmentBaseItemType,
      TwoHandedRangedWeaponGenerationTemplate
    >,
    EquipmentType.TwoHandedRangedWeapon,
    randomNumberGenerator,
    affixGenerator
  );

  const twoHandedMeleeWeaponBuilder = new WeaponGenerationBuilder(
    TWO_HANDED_MELEE_EQUIPMENT_GENERATION_TEMPLATES as Record<
      EquipmentBaseItemType,
      TwoHandedMeleeWeaponGenerationTemplate
    >,
    EquipmentType.TwoHandedMeleeWeapon,
    randomNumberGenerator,
    affixGenerator
  );

  const shieldBuilder = new ShieldGenerationBuilder(
    SHIELD_EQUIPMENT_GENERATION_TEMPLATES as Record<
      EquipmentBaseItemType,
      ShieldGenerationTemplate
    >,
    randomNumberGenerator,
    affixGenerator
  );

  const bodyArmorBuilder = new ArmorGenerationBuilder(
    BODY_ARMOR_EQUIPMENT_GENERATION_TEMPLATES as Record<
      EquipmentBaseItemType,
      BodyArmorGenerationTemplate
    >,
    EquipmentType.BodyArmor,
    randomNumberGenerator,
    affixGenerator
  );

  const headGearBuilder = new ArmorGenerationBuilder(
    HEAD_GEAR_EQUIPMENT_GENERATION_TEMPLATES as Record<
      EquipmentBaseItemType,
      HeadGearGenerationTemplate
    >,
    EquipmentType.HeadGear,
    randomNumberGenerator,
    affixGenerator
  );

  const ringBuilder = new JewelryGenerationBuilder(
    RING_GENERATION_TEMPLATES as Record<EquipmentBaseItemType, JewelryGenerationTemplate>,
    EquipmentType.Ring,
    randomNumberGenerator,
    affixGenerator
  );

  const amuletBuilder = new JewelryGenerationBuilder(
    AMULET_GENERATION_TEMPLATES as Record<EquipmentBaseItemType, JewelryGenerationTemplate>,
    EquipmentType.Amulet,
    randomNumberGenerator,
    affixGenerator
  );

  const oneHandedMeleeWeaponDirector = new ItemGenerationDirector(oneHandedMeleeWeaponBuilder);
  const twoHandedMeleeWeaponDirector = new ItemGenerationDirector(twoHandedMeleeWeaponBuilder);
  const twoHandedRangedWeaponDirector = new ItemGenerationDirector(twoHandedRangedWeaponBuilder);
  const shieldDirector = new ItemGenerationDirector(shieldBuilder);
  const bodyArmorDirector = new ItemGenerationDirector(bodyArmorBuilder);
  const headGearDirector = new ItemGenerationDirector(headGearBuilder);
  const ringDirector = new ItemGenerationDirector(ringBuilder);
  const amuletDirector = new ItemGenerationDirector(amuletBuilder);

  const equipmentGenerationDirectors: Record<EquipmentType, ItemGenerationDirector> = {
    [EquipmentType.OneHandedMeleeWeapon]: oneHandedMeleeWeaponDirector,
    [EquipmentType.TwoHandedMeleeWeapon]: twoHandedMeleeWeaponDirector,
    [EquipmentType.TwoHandedRangedWeapon]: twoHandedRangedWeaponDirector,
    [EquipmentType.Shield]: shieldDirector,
    [EquipmentType.BodyArmor]: bodyArmorDirector,
    [EquipmentType.HeadGear]: headGearDirector,
    [EquipmentType.Ring]: ringDirector,
    [EquipmentType.Amulet]: amuletDirector,
  };

  const equipmentGenerationBuilders: Record<EquipmentType, ItemGenerationBuilder> = {
    [EquipmentType.OneHandedMeleeWeapon]: oneHandedMeleeWeaponBuilder,
    [EquipmentType.TwoHandedMeleeWeapon]: twoHandedMeleeWeaponBuilder,
    [EquipmentType.TwoHandedRangedWeapon]: twoHandedRangedWeaponBuilder,
    [EquipmentType.Shield]: shieldBuilder,
    [EquipmentType.BodyArmor]: bodyArmorBuilder,
    [EquipmentType.HeadGear]: headGearBuilder,
    [EquipmentType.Ring]: ringBuilder,
    [EquipmentType.Amulet]: amuletBuilder,
  };

  return { builders: equipmentGenerationBuilders, directors: equipmentGenerationDirectors };
}
