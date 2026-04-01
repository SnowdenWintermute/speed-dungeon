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
import { EquipmentRandomizer } from "./equipment-randomizer.js";
export { EquipmentBuilder } from "./equipment-builder.js";
export { WeaponBuilder } from "./weapon-builder.js";
export { ArmorBuilder } from "./armor-builder.js";
export { ShieldBuilder } from "./shield-builder.js";
export { JewelryBuilder } from "./jewelry-builder.js";
export { ConsumableBuilder } from "./consumable-builder.js";
export { EquipmentRandomizer } from "./equipment-randomizer.js";

export class ItemBuilder {
  constructor(private randomizer: EquipmentRandomizer) {}

  oneHandedMeleeWeapon(baseItem: OneHandedMeleeWeapon): WeaponBuilder {
    return new WeaponBuilder(
      {
        equipmentType: EquipmentType.OneHandedMeleeWeapon,
        baseItemType: baseItem,
      },
      this.randomizer
    );
  }

  twoHandedMeleeWeapon(baseItem: TwoHandedMeleeWeapon): WeaponBuilder {
    return new WeaponBuilder(
      {
        equipmentType: EquipmentType.TwoHandedMeleeWeapon,
        baseItemType: baseItem,
      },
      this.randomizer
    );
  }

  twoHandedRangedWeapon(baseItem: TwoHandedRangedWeapon): WeaponBuilder {
    return new WeaponBuilder(
      {
        equipmentType: EquipmentType.TwoHandedRangedWeapon,
        baseItemType: baseItem,
      },
      this.randomizer
    );
  }

  bodyArmor(baseItem: BodyArmor): ArmorBuilder {
    return new ArmorBuilder(
      {
        equipmentType: EquipmentType.BodyArmor,
        baseItemType: baseItem,
      },
      this.randomizer
    );
  }

  headGear(baseItem: HeadGear): ArmorBuilder {
    return new ArmorBuilder(
      {
        equipmentType: EquipmentType.HeadGear,
        baseItemType: baseItem,
      },
      this.randomizer
    );
  }

  shield(baseItem: Shield): ShieldBuilder {
    return new ShieldBuilder(
      {
        equipmentType: EquipmentType.Shield,
        baseItemType: baseItem,
      },
      this.randomizer
    );
  }

  ring(): JewelryBuilder {
    return new JewelryBuilder(
      {
        equipmentType: EquipmentType.Ring,
        baseItemType: Ring.Ring,
      },
      this.randomizer
    );
  }

  amulet(): JewelryBuilder {
    return new JewelryBuilder(
      {
        equipmentType: EquipmentType.Amulet,
        baseItemType: Amulet.Amulet,
      },
      this.randomizer
    );
  }

  consumable(type: ConsumableType): ConsumableBuilder {
    return new ConsumableBuilder(type);
  }
}
