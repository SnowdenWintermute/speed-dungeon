import {
  Amulet,
  EquipmentBaseItem,
  EquipmentType,
  Jewelry,
  NumberRange,
  PrefixType,
  Ring,
  SuffixType,
  iterateNumericEnum,
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

    for (const prefix of iterateNumericEnum(PrefixType)) {
      switch (prefix) {
        case PrefixType.ArmorClass:
        case PrefixType.PercentDamage:
          break;
        case PrefixType.Mp:
        case PrefixType.Evasion:
        case PrefixType.Accuracy:
        case PrefixType.LifeSteal:
        case PrefixType.ArmorPenetration:
        case PrefixType.Agility:
          this.possibleAffixes.prefix[prefix] = 5;
      }
    }

    for (const suffix of iterateNumericEnum(SuffixType)) {
      switch (suffix) {
        case SuffixType.Durability:
          break;
        case SuffixType.Hp:
        case SuffixType.Vitality:
        case SuffixType.AllBase:
        case SuffixType.Strength:
        case SuffixType.Spirit:
        case SuffixType.Dexterity:
        case SuffixType.Damage:
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
