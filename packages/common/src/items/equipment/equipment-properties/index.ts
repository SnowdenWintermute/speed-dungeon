import { CombatantAttributeRecord } from "../../../combatants/combatant-properties";
import MaxAndCurrent from "../../../primatives/max-and-current";
import { Affix } from "../affixes";
import { EquipmentTrait } from "../equipment-traits";
import { EquipmentBaseItem, EquipmentType } from "../equipment-types";
import { ArmorProperties } from "./armor-properties";
import { ShieldProperties } from "./shield-properties";
import { WeaponProperties } from "./weapon-properties";

export default class EquipmentProperties {
  constructor(
    public baseItem: EquipmentBaseItem,
    public equipmentTypeProperties: EquipmentTypeProperties,
    public durability: MaxAndCurrent,
    public attributes: CombatantAttributeRecord,
    public affixes: Affix[],
    public traits: EquipmentTrait[]
  ) {}

  getBaseArmorClass() {
    switch (this.equipmentTypeProperties.type) {
      case EquipmentType.BodyArmor:
      case EquipmentType.HeadGear:
      case EquipmentType.Shield:
        return this.equipmentTypeProperties.armorClass;
      default:
        return 0;
    }
  }
}

export type EquipmentTypeProperties = ArmorProperties | WeaponProperties | ShieldProperties;
