import { ShieldProperties } from "../../equipment/equipment-properties/index.js";
import { EquipmentType } from "../../equipment/equipment-types/index.js";
import { ShieldGenerationTemplate } from "../equipment-templates/base-templates.js";
import { EquipmentBuilder } from "./equipment-builder.js";

export class ShieldBuilder extends EquipmentBuilder<EquipmentType.Shield> {
  private _armorClass: number | null = null;

  override randomizeBaseProperties(): this {
    const shieldTemplate = this.template as ShieldGenerationTemplate;
    this._armorClass = this.randomizer.rollArmorClass(shieldTemplate.acRange);
    return this;
  }

  armorClass(value: number): this {
    this._armorClass = value;
    return this;
  }

  protected buildEquipmentBaseItemProperties(): ShieldProperties {
    const shieldTemplate = this.template as ShieldGenerationTemplate;

    return {
      ...this.baseEquipment,
      armorClass: this._armorClass ?? shieldTemplate.acRange.max,
      size: shieldTemplate.size,
    };
  }
}
