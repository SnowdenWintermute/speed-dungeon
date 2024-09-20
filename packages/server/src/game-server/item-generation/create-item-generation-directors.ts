import { EquipmentBaseItemType, EquipmentType } from "@speed-dungeon/common";
import { GameServer } from "../index.js";
import { ItemGenerationDirector } from "./item-generation-director.js";
import { ShieldGenerationBuilder } from "./shield-generation-builder.js";
import { WeaponGenerationBuilder } from "./weapon-generation-builder.js";
import {
  SHIELD_EQUIPMENT_GENERATION_TEMPLATES,
  ShieldGenerationTemplate,
} from "./equipment-templates/shield-templates.js";
import {
  ONE_HANDED_MELEE_EQUIPMENT_GENERATION_TEMPLATES,
  OneHandedMeleeWeaponGenerationTemplate,
} from "./equipment-templates/one-handed-melee-weapon-templates.js";
import {
  TWO_HANDED_MELEE_EQUIPMENT_GENERATION_TEMPLATES,
  TwoHandedMeleeWeaponGenerationTemplate,
} from "./equipment-templates/two-handed-melee-weapon-templates.js";
import {
  TWO_HANDED_RANGED_EQUIPMENT_GENERATION_TEMPLATES,
  TwoHandedRangedWeaponGenerationTemplate,
} from "./equipment-templates/two-handed-ranged-weapon-templates.js";
import {
  BODY_ARMOR_EQUIPMENT_GENERATION_TEMPLATES,
  BodyArmorGenerationTemplate,
} from "./equipment-templates/body-armor-generation-templates.js";
import {
  HEAD_GEAR_EQUIPMENT_GENERATION_TEMPLATES,
  HeadGearGenerationTemplate,
} from "./equipment-templates/head-gear-generation-templates.js";
import { ArmorGenerationBuilder } from "./armor-generation-builder.js";
import { EquipmentGenerationBuilder } from "./equipment-generation-builder";
import {
  AMULET_GENERATION_TEMPLATES,
  JewelryGenerationTemplate,
  RING_GENERATION_TEMPLATES,
} from "./equipment-templates/jewelry-generation-templates.js";
import { JewelryGenerationBuilder } from "./jewelry-generation-builder.js";

export function createItemGenerationDirectors(
  this: GameServer
): Partial<Record<EquipmentType, ItemGenerationDirector>> {
  const oneHandedMeleeWeaponBuilder = new WeaponGenerationBuilder(
    ONE_HANDED_MELEE_EQUIPMENT_GENERATION_TEMPLATES as Record<
      EquipmentBaseItemType,
      OneHandedMeleeWeaponGenerationTemplate
    >,
    EquipmentType.OneHandedMeleeWeapon
  );
  const twoHandedRangedWeaponBuilder = new WeaponGenerationBuilder(
    TWO_HANDED_RANGED_EQUIPMENT_GENERATION_TEMPLATES as Record<
      EquipmentBaseItemType,
      TwoHandedRangedWeaponGenerationTemplate
    >,
    EquipmentType.TwoHandedRangedWeapon
  );
  const twoHandedMeleeWeaponBuilder = new WeaponGenerationBuilder(
    TWO_HANDED_MELEE_EQUIPMENT_GENERATION_TEMPLATES as Record<
      EquipmentBaseItemType,
      TwoHandedMeleeWeaponGenerationTemplate
    >,
    EquipmentType.TwoHandedMeleeWeapon
  );
  const shieldBuilder = new ShieldGenerationBuilder(
    SHIELD_EQUIPMENT_GENERATION_TEMPLATES as Record<EquipmentBaseItemType, ShieldGenerationTemplate>
  );
  const bodyArmorBuilder = new ArmorGenerationBuilder(
    BODY_ARMOR_EQUIPMENT_GENERATION_TEMPLATES as Record<
      EquipmentBaseItemType,
      BodyArmorGenerationTemplate
    >,
    EquipmentType.BodyArmor
  );
  const headGearBuilder = new ArmorGenerationBuilder(
    HEAD_GEAR_EQUIPMENT_GENERATION_TEMPLATES as Record<
      EquipmentBaseItemType,
      HeadGearGenerationTemplate
    >,
    EquipmentType.HeadGear
  );
  const ringBuilder = new JewelryGenerationBuilder(
    RING_GENERATION_TEMPLATES as Record<EquipmentBaseItemType, JewelryGenerationTemplate>,
    EquipmentType.Ring
  );
  const amuletBuilder = new JewelryGenerationBuilder(
    AMULET_GENERATION_TEMPLATES as Record<EquipmentBaseItemType, JewelryGenerationTemplate>,
    EquipmentType.Amulet
  );

  const oneHandedMeleeWeaponDirector = new ItemGenerationDirector(oneHandedMeleeWeaponBuilder);
  const twoHandedMeleeWeaponDirector = new ItemGenerationDirector(twoHandedMeleeWeaponBuilder);
  const twoHandedRangedWeaponDirector = new ItemGenerationDirector(twoHandedRangedWeaponBuilder);
  const shieldDirector = new ItemGenerationDirector(shieldBuilder);
  const bodyArmorDirector = new ItemGenerationDirector(bodyArmorBuilder);
  const headGearDirector = new ItemGenerationDirector(headGearBuilder);
  const ringDirector = new ItemGenerationDirector(ringBuilder);
  const amuletDirector = new ItemGenerationDirector(amuletBuilder);

  const equipmentGenerationDirectors: Partial<Record<EquipmentType, ItemGenerationDirector>> = {
    [EquipmentType.OneHandedMeleeWeapon]: oneHandedMeleeWeaponDirector,
    [EquipmentType.TwoHandedMeleeWeapon]: twoHandedMeleeWeaponDirector,
    [EquipmentType.TwoHandedRangedWeapon]: twoHandedRangedWeaponDirector,
    [EquipmentType.Shield]: shieldDirector,
    [EquipmentType.BodyArmor]: bodyArmorDirector,
    [EquipmentType.HeadGear]: headGearDirector,
    [EquipmentType.Ring]: ringDirector,
    [EquipmentType.Amulet]: amuletDirector,
  };

  return equipmentGenerationDirectors;
}
