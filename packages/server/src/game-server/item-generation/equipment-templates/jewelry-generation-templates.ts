import {
  Amulet,
  EquipmentBaseItem,
  EquipmentType,
  Jewelry,
  NumberRange,
  PREFIX_TYPES,
  AffixType,
  Ring,
  SUFFIX_TYPES,
} from "@speed-dungeon/common";
import { EquipmentGenerationTemplate } from "./equipment-generation-template-abstract-classes.js";

export class JewelryGenerationTemplate extends EquipmentGenerationTemplate {
  constructor(public equipmentBaseItem: EquipmentBaseItem) {
    if (
      equipmentBaseItem.equipmentType !== EquipmentType.Ring &&
      equipmentBaseItem.equipmentType !== EquipmentType.Amulet
    )
      throw new Error("invalid base item provided");
    super(equipmentBaseItem);

    this.levelRange = new NumberRange(3, 10);

    for (const prefix of PREFIX_TYPES) {
      switch (prefix) {
        case AffixType.FlatArmorClass:
        case AffixType.PercentDamage:
          break;
        case AffixType.Mp:
        case AffixType.Evasion:
        case AffixType.Accuracy:
        case AffixType.LifeSteal:
        case AffixType.ArmorPenetration:
        case AffixType.Agility:
          this.possibleAffixes.prefix[prefix] = 5;
      }
    }

    for (const suffix of SUFFIX_TYPES) {
      switch (suffix) {
        case AffixType.Durability:
          break;
        case AffixType.Hp:
        case AffixType.Vitality:
        case AffixType.AllBase:
        case AffixType.Strength:
        case AffixType.Spirit:
        case AffixType.Dexterity:
        case AffixType.FlatDamage:
          this.possibleAffixes.suffix[suffix] = 5;
      }
    }
  }
}

export const RING_GENERATION_TEMPLATES: Partial<Record<Jewelry, JewelryGenerationTemplate>> = {
  [Jewelry.Ring]: new JewelryGenerationTemplate({
    equipmentType: EquipmentType.Ring,
    baseItemType: Ring.Ring,
  }),
};

export const AMULET_GENERATION_TEMPLATES: Partial<Record<Jewelry, JewelryGenerationTemplate>> = {
  [Jewelry.Amulet]: new JewelryGenerationTemplate({
    equipmentType: EquipmentType.Amulet,
    baseItemType: Amulet.Amulet,
  }),
};
