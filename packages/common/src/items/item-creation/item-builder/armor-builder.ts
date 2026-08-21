import { ArmorProperties } from "../../equipment/equipment-properties/index.js";
import { EquipmentType } from "../../equipment/equipment-types/index.js";
import { ArmorGenerationTemplate } from "../equipment-templates/base-templates.js";
import { EquipmentBuilder } from "./equipment-builder.js";

export class ArmorBuilder extends EquipmentBuilder<
  EquipmentType.BodyArmor | EquipmentType.HeadGear
> {
  private _armorClass: number | null = null;

  override randomizeBaseProperties(): this {
    const armorTemplate = this.template as ArmorGenerationTemplate;
    this._armorClass = this.randomizer.rollArmorClass(armorTemplate.acRange);
    return this;
  }

  armorClass(value: number): this {
    this._armorClass = value;
    return this;
  }

  protected buildEquipmentBaseItemProperties(): ArmorProperties {
    const armorTemplate = this.template as ArmorGenerationTemplate;

    return {
      ...this.baseEquipment,
      armorClass: this._armorClass ?? armorTemplate.acRange.max,
      armorCategory: armorTemplate.armorCategory,
    };
  }
}
