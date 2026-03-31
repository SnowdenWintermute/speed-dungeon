import { ArmorCategory, ArmorProperties } from "../../equipment/equipment-properties/armor-properties.js";
import { EquipmentBaseItemProperties } from "../../equipment/equipment-properties/index.js";
import {
  BodyArmorBaseItemType,
  EquipmentBaseItem,
  EquipmentType,
  HeadGearBaseItemType,
} from "../../equipment/equipment-types/index.js";
import { formatBodyArmor } from "../../equipment/equipment-types/body-armor.js";
import { formatHeadGear } from "../../equipment/equipment-types/head-gear.js";
import { ArmorGenerationTemplate } from "../equipment-templates/base-templates.js";
import { EquipmentBuilder } from "./equipment-builder.js";
import { EquipmentRandomizer } from "./equipment-randomizer.js";

type ArmorBaseEquipment = BodyArmorBaseItemType | HeadGearBaseItemType;

export class ArmorBuilder extends EquipmentBuilder {
  private _armorClass: number | null = null;

  constructor(baseEquipment: EquipmentBaseItem, randomizer: EquipmentRandomizer) {
    super(baseEquipment, randomizer);
  }

  override randomizeBaseProperties(): this {
    const armorTemplate = this.template as ArmorGenerationTemplate;
    this._armorClass = this.randomizer.rollArmorClass(armorTemplate.acRange);
    return this;
  }

  armorClass(value: number): this {
    this._armorClass = value;
    return this;
  }

  protected defaultName(): string {
    const tagged = this.baseEquipment as ArmorBaseEquipment;
    switch (tagged.equipmentType) {
      case EquipmentType.BodyArmor:
        return formatBodyArmor(tagged.baseItemType);
      case EquipmentType.HeadGear:
        return formatHeadGear(tagged.baseItemType);
    }
  }

  protected buildEquipmentBaseItemProperties(): EquipmentBaseItemProperties {
    const tagged = this.baseEquipment as ArmorBaseEquipment;
    const armorTemplate = this.template as ArmorGenerationTemplate;

    const properties: ArmorProperties = {
      taggedBaseEquipment: tagged,
      equipmentType: tagged.equipmentType,
      armorClass: this._armorClass ?? armorTemplate.acRange.max,
      armorCategory: armorTemplate.armorCategory,
    };

    return properties;
  }
}
