import {
  EquipmentBaseItem,
  EquipmentType,
  Jewelry,
  NumberRange,
  PrefixType,
  SuffixType,
  iterateNumericEnum,
} from "@speed-dungeon/common";
import { EquipmentGenerationTemplate } from "./equipment-generation-template-abstract-classes";

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
          break;
        case PrefixType.Mp:
        case PrefixType.Resilience:
        case PrefixType.Evasion:
        case PrefixType.Accuracy:
        case PrefixType.PercentDamage:
        case PrefixType.LifeSteal:
        case PrefixType.ArmorPenetration:
        case PrefixType.Agility:
        case PrefixType.Focus:
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
        case SuffixType.Intelligence:
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
    baseItemType: Jewelry.Ring,
  }),
};

export const AMULET_GENERATION_TEMPLATES: Partial<Record<Jewelry, JewelryGenerationTemplate>> = {
  [Jewelry.Amulet]: new JewelryGenerationTemplate({
    equipmentType: EquipmentType.Amulet,
    baseItemType: Jewelry.Amulet,
  }),
};
