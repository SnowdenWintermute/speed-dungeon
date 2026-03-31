import {
  ResourceChangeSource,
  ResourceChangeSourceCategory,
} from "../../../combat/hp-change-source-types.js";
import { WeaponProperties } from "../../equipment/equipment-properties/weapon-properties.js";
import { EquipmentBaseItemProperties } from "../../equipment/equipment-properties/index.js";
import {
  EquipmentBaseItem,
  EquipmentType,
  OneHandedMeleeWeaponBaseItemType,
  TwoHandedMeleeWeaponBaseItemType,
  TwoHandedRangedWeaponBaseItemType,
} from "../../equipment/equipment-types/index.js";
import { ONE_HANDED_MELEE_WEAPON_NAMES } from "../../equipment/equipment-types/one-handed-melee-weapon.js";
import { formatTwoHandedMeleeWeapon } from "../../equipment/equipment-types/two-handed-melee-weapon.js";
import { formatTwoHandedRangedWeapon } from "../../equipment/equipment-types/two-handed-ranged-weapon.js";
import { WeaponGenerationTemplate } from "../equipment-templates/base-templates.js";
import { EquipmentBuilder } from "./equipment-builder.js";

type WeaponBaseEquipment =
  | OneHandedMeleeWeaponBaseItemType
  | TwoHandedMeleeWeaponBaseItemType
  | TwoHandedRangedWeaponBaseItemType;

export class WeaponBuilder extends EquipmentBuilder {
  private _damageClassification: ResourceChangeSource[] | null = null;

  override randomizeBaseProperties(): this {
    const weaponTemplate = this.template as WeaponGenerationTemplate;
    this._damageClassification = this.randomizer.rollDamageClassifications(weaponTemplate);
    return this;
  }

  damageClassification(sources: ResourceChangeSource[]): this {
    this._damageClassification = sources;
    return this;
  }

  protected defaultName(): string {
    const tagged = this.baseEquipment as WeaponBaseEquipment;
    switch (tagged.equipmentType) {
      case EquipmentType.OneHandedMeleeWeapon:
        return ONE_HANDED_MELEE_WEAPON_NAMES[tagged.baseItemType];
      case EquipmentType.TwoHandedMeleeWeapon:
        return formatTwoHandedMeleeWeapon(tagged.baseItemType);
      case EquipmentType.TwoHandedRangedWeapon:
        return formatTwoHandedRangedWeapon(tagged.baseItemType);
    }
  }

  protected buildEquipmentBaseItemProperties(): EquipmentBaseItemProperties {
    const tagged = this.baseEquipment as WeaponBaseEquipment;
    const weaponTemplate = this.template as WeaponGenerationTemplate;

    const damageClassification =
      this._damageClassification ??
      weaponTemplate.possibleDamageClassifications.slice(
        0,
        weaponTemplate.numDamageClassifications
      );

    const properties: WeaponProperties = {
      taggedBaseEquipment: tagged,
      equipmentType: tagged.equipmentType,
      damage: weaponTemplate.damage,
      damageClassification,
    };

    return properties;
  }
}
