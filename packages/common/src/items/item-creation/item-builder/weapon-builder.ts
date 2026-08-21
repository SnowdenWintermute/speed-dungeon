import { ResourceChangeSource } from "../../../combat/hp-change-source-types.js";
import { WeaponProperties } from "../../equipment/equipment-properties/index.js";
import { EquipmentType } from "../../equipment/equipment-types/index.js";
import { WeaponGenerationTemplate } from "../equipment-templates/base-templates.js";
import { EquipmentBuilder } from "./equipment-builder.js";

export class WeaponBuilder extends EquipmentBuilder<
  | EquipmentType.OneHandedMeleeWeapon
  | EquipmentType.TwoHandedMeleeWeapon
  | EquipmentType.TwoHandedRangedWeapon
> {
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

  protected buildEquipmentBaseItemProperties(): WeaponProperties {
    const weaponTemplate = this.template as WeaponGenerationTemplate;

    const damageClassification =
      this._damageClassification ??
      weaponTemplate.possibleDamageClassifications.slice(
        0,
        weaponTemplate.damageClassificationsCount
      );

    return {
      ...this.baseEquipment,
      damage: weaponTemplate.damage,
      damageClassification,
    };
  }
}
