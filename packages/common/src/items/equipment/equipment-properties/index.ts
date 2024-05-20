import { CombatAttributes } from "../../../combatants/combat-attributes";
import MaxAndCurrent from "../../../primatives/max-and-current";
import { Affix } from "../affixes";
import { EquipmentTrait } from "../equipment-traits";
import { EquipmentBaseItem } from "../equipment-types";
import { ArmorProperties } from "./armor-properties";
import { ShieldProperties } from "./shield-properties";
import { WeaponProperties } from "./weapon-properties";

export default class EquipmentProperties {
  constructor(
    public baseItem: EquipmentBaseItem,
    public equipmentTypeProperties: EquipmentTypeProperties,
    public durability: MaxAndCurrent,
    public attributes: Record<CombatAttributes, number>,
    public affixes: Affix[],
    public traits: EquipmentTrait[]
  ) {}
}

export type EquipmentTypeProperties = ArmorProperties | WeaponProperties | ShieldProperties;
