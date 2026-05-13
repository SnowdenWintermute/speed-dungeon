import { ShieldProperties } from "../../equipment/equipment-properties/shield-properties.js";
import { EquipmentBaseItemProperties } from "../../equipment/equipment-properties/index.js";
import { EquipmentBaseItem, EquipmentType, ShieldBaseItemType } from "../../equipment/equipment-types/index.js";
import { formatShield } from "../../equipment/equipment-types/shield.js";
import { ShieldGenerationTemplate } from "../equipment-templates/shields.js";
import { EquipmentBuilder } from "./equipment-builder.js";
import { EquipmentRandomizer } from "./equipment-randomizer.js";

export class ShieldBuilder extends EquipmentBuilder {
  private _armorClass: number | null = null;

  constructor(baseEquipment: EquipmentBaseItem, randomizer: EquipmentRandomizer) {
    super(baseEquipment, randomizer);
  }

  override randomizeBaseProperties(): this {
    const shieldTemplate = this.template as ShieldGenerationTemplate;
    this._armorClass = this.randomizer.rollArmorClass(shieldTemplate.acRange);
    return this;
  }

  armorClass(value: number): this {
    this._armorClass = value;
    return this;
  }

  protected defaultName(): string {
    const tagged = this.baseEquipment as ShieldBaseItemType;
    return formatShield(tagged.baseItemType);
  }

  protected buildEquipmentBaseItemProperties(): EquipmentBaseItemProperties {
    const tagged = this.baseEquipment as ShieldBaseItemType;
    const shieldTemplate = this.template as ShieldGenerationTemplate;

    const properties: ShieldProperties = {
      taggedBaseEquipment: tagged,
      equipmentType: EquipmentType.Shield,
      armorClass: this._armorClass ?? shieldTemplate.acRange.max,
      size: shieldTemplate.size,
    };

    return properties;
  }
}
