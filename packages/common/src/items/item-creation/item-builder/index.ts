import { EquipmentType } from "../../equipment/equipment-types/index.js";
import { BodyArmor } from "../../equipment/equipment-types/body-armor.js";
import { HeadGear } from "../../equipment/equipment-types/head-gear.js";
import { OneHandedMeleeWeapon } from "../../equipment/equipment-types/one-handed-melee-weapon.js";
import { TwoHandedMeleeWeapon } from "../../equipment/equipment-types/two-handed-melee-weapon.js";
import { TwoHandedRangedWeapon } from "../../equipment/equipment-types/two-handed-ranged-weapon.js";
import { Shield } from "../../equipment/equipment-types/shield.js";
import { Ring, Amulet } from "../../equipment/equipment-types/jewelry.js";
import { ConsumableType } from "../../consumables/consumable-types.js";
import { WeaponBuilder } from "./weapon-builder.js";
import { ArmorBuilder } from "./armor-builder.js";
import { ShieldBuilder } from "./shield-builder.js";
import { JewelryBuilder } from "./jewelry-builder.js";
import { ConsumableBuilder } from "./consumable-builder.js";

export { EquipmentBuilder } from "./equipment-builder.js";
export { WeaponBuilder } from "./weapon-builder.js";
export { ArmorBuilder } from "./armor-builder.js";
export { ShieldBuilder } from "./shield-builder.js";
export { JewelryBuilder } from "./jewelry-builder.js";
export { ConsumableBuilder } from "./consumable-builder.js";

export class ItemBuilder {
  static oneHandedMeleeWeapon(baseItem: OneHandedMeleeWeapon): WeaponBuilder {
    return new WeaponBuilder({
      equipmentType: EquipmentType.OneHandedMeleeWeapon,
      baseItemType: baseItem,
    });
  }

  static twoHandedMeleeWeapon(baseItem: TwoHandedMeleeWeapon): WeaponBuilder {
    return new WeaponBuilder({
      equipmentType: EquipmentType.TwoHandedMeleeWeapon,
      baseItemType: baseItem,
    });
  }

  static twoHandedRangedWeapon(baseItem: TwoHandedRangedWeapon): WeaponBuilder {
    return new WeaponBuilder({
      equipmentType: EquipmentType.TwoHandedRangedWeapon,
      baseItemType: baseItem,
    });
  }

  static bodyArmor(baseItem: BodyArmor): ArmorBuilder {
    return new ArmorBuilder({
      equipmentType: EquipmentType.BodyArmor,
      baseItemType: baseItem,
    });
  }

  static headGear(baseItem: HeadGear): ArmorBuilder {
    return new ArmorBuilder({
      equipmentType: EquipmentType.HeadGear,
      baseItemType: baseItem,
    });
  }

  static shield(baseItem: Shield): ShieldBuilder {
    return new ShieldBuilder({
      equipmentType: EquipmentType.Shield,
      baseItemType: baseItem,
    });
  }

  static ring(): JewelryBuilder {
    return new JewelryBuilder({
      equipmentType: EquipmentType.Ring,
      baseItemType: Ring.Ring,
    });
  }

  static amulet(): JewelryBuilder {
    return new JewelryBuilder({
      equipmentType: EquipmentType.Amulet,
      baseItemType: Amulet.Amulet,
    });
  }

  static consumable(type: ConsumableType): ConsumableBuilder {
    return new ConsumableBuilder(type);
  }
}
