import { EquipmentBaseItemType, EquipmentType } from "@speed-dungeon/common";
import { GameServer } from "..";
import { ItemGenerationDirector } from "./item-generation-director";
import { ShieldGenerationBuilder } from "./shield-generation-builder";
import { WeaponGenerationBuilder } from "./weapon-generation-builder";
import {
  SHIELD_EQUIPMENT_GENERATION_TEMPLATES,
  ShieldGenerationTemplate,
} from "./equipment-templates/shield-templates";
import {
  ONE_HANDED_MELEE_EQUIPMENT_GENERATION_TEMPLATES,
  OneHandedMeleeWeaponGenerationTemplate,
} from "./equipment-templates/one-handed-melee-weapon-templates";
import {
  TWO_HANDED_MELEE_EQUIPMENT_GENERATION_TEMPLATES,
  TwoHandedMeleeWeaponGenerationTemplate,
} from "./equipment-templates/two-handed-melee-weapon-templates";
import {
  TWO_HANDED_RANGED_EQUIPMENT_GENERATION_TEMPLATES,
  TwoHandedRangedWeaponGenerationTemplate,
} from "./equipment-templates/two-handed-ranged-weapon-templates";
import {
  BODY_ARMOR_EQUIPMENT_GENERATION_TEMPLATES,
  BodyArmorGenerationTemplate,
} from "./equipment-templates/body-armor-generation-templates";
import { ArmorGenerationBuilder } from "./armor-generation-builder";

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

  const oneHandedMeleeWeaponDirector = new ItemGenerationDirector(oneHandedMeleeWeaponBuilder);
  const twoHandedMeleeWeaponDirector = new ItemGenerationDirector(twoHandedMeleeWeaponBuilder);
  const twoHandedRangedWeaponDirector = new ItemGenerationDirector(twoHandedRangedWeaponBuilder);
  const shieldDirector = new ItemGenerationDirector(shieldBuilder);
  const bodyArmorDirector = new ItemGenerationDirector(bodyArmorBuilder);

  const equipmentGenerationDirectors: Partial<Record<EquipmentType, ItemGenerationDirector>> = {
    [EquipmentType.OneHandedMeleeWeapon]: oneHandedMeleeWeaponDirector,
    [EquipmentType.TwoHandedMeleeWeapon]: twoHandedMeleeWeaponDirector,
    [EquipmentType.TwoHandedRangedWeapon]: twoHandedRangedWeaponDirector,
    [EquipmentType.Shield]: shieldDirector,
    [EquipmentType.BodyArmor]: bodyArmorDirector,
  };

  return equipmentGenerationDirectors;
}
