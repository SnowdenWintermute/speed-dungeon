import {
  EquipmentBaseItem,
  EquipmentType,
  NumberRange,
  Shield,
  PrefixType,
  SuffixType,
  iterateNumericEnum,
  ShieldSize,
  CombatAttribute,
} from "@speed-dungeon/common";
import { EquipmentGenerationTemplate } from "./equipment-generation-template-abstract-classes.js";

export class ShieldGenerationTemplate extends EquipmentGenerationTemplate {
  constructor(
    public acRange: NumberRange,
    public size: ShieldSize,
    public equipmentBaseItem: EquipmentBaseItem
  ) {
    if (equipmentBaseItem.equipmentType !== EquipmentType.Shield)
      throw new Error("invalid base item provided");

    super(equipmentBaseItem);
    for (const prefix of iterateNumericEnum(PrefixType)) {
      switch (prefix) {
        case PrefixType.Accuracy:
        case PrefixType.PercentDamage:
        case PrefixType.LifeSteal:
        case PrefixType.ArmorPenetration:
          break;
        case PrefixType.Agility:
          this.possibleAffixes.prefix[prefix] = 3;
          break;
        case PrefixType.Mp:
        case PrefixType.ArmorClass:
        case PrefixType.Evasion:
          this.possibleAffixes.prefix[prefix] = 5;
      }
    }
    for (const suffix of iterateNumericEnum(SuffixType)) {
      switch (suffix) {
        case SuffixType.Damage:
          break;
        case SuffixType.AllBase:
          this.possibleAffixes.suffix[suffix] = 4;
          break;
        case SuffixType.Hp:
        case SuffixType.Vitality:
        case SuffixType.Strength:
        case SuffixType.Intelligence:
        case SuffixType.Dexterity:
        case SuffixType.Durability:
        case SuffixType.PercentArmorClass:
          this.possibleAffixes.suffix[suffix] = 5;
      }
    }
  }
}

export const SHIELD_EQUIPMENT_GENERATION_TEMPLATES: Record<Shield, ShieldGenerationTemplate> =
  (() => {
    const toReturn: Partial<Record<Shield, ShieldGenerationTemplate>> = {};

    for (const shield of iterateNumericEnum(Shield)) {
      let template = new ShieldGenerationTemplate(new NumberRange(1, 1), ShieldSize.Small, {
        equipmentType: EquipmentType.Shield,
        baseItemType: shield,
      });

      switch (shield) {
        case Shield.PotLid:
          template.levelRange = new NumberRange(0, 0);
          template.acRange = new NumberRange(2, 2);
          template.size = ShieldSize.Small;
          template.maxDurability = 4;
          break;
        case Shield.CabinetDoor:
          template.levelRange = new NumberRange(1, 3);
          template.acRange = new NumberRange(2, 6);
          template.size = ShieldSize.Small;
          template.maxDurability = 6;
          break;
        case Shield.Heater:
          template.levelRange = new NumberRange(2, 4);
          template.acRange = new NumberRange(10, 18);
          template.size = ShieldSize.Medium;
          template.maxDurability = 8;
          template.requirements[CombatAttribute.Strength] = 3;
          break;
        case Shield.Buckler:
          template.levelRange = new NumberRange(3, 5);
          template.acRange = new NumberRange(20, 32);
          template.size = ShieldSize.Small;
          template.maxDurability = 9;
          template.requirements[CombatAttribute.Strength] = 3;
          template.requirements[CombatAttribute.Dexterity] = 2;
          break;
        case Shield.Pavise:
          template.levelRange = new NumberRange(4, 6);
          template.acRange = new NumberRange(32, 41);
          template.size = ShieldSize.Large;
          template.maxDurability = 12;
          template.requirements[CombatAttribute.Strength] = 7;
          template.requirements[CombatAttribute.Dexterity] = 3;
          break;
        case Shield.Aspis:
          template.levelRange = new NumberRange(5, 7);
          template.acRange = new NumberRange(40, 48);
          template.size = ShieldSize.Medium;
          template.maxDurability = 14;
          template.requirements[CombatAttribute.Strength] = 7;
          template.requirements[CombatAttribute.Dexterity] = 7;
          break;
        case Shield.LanternShield:
          template.levelRange = new NumberRange(5, 6);
          template.acRange = new NumberRange(50, 55);
          template.size = ShieldSize.Small;
          template.maxDurability = 15;
          template.requirements[CombatAttribute.Intelligence] = 3;
          template.requirements[CombatAttribute.Dexterity] = 7;
          template.possibleAffixes.suffix[SuffixType.Damage] = 5;
          break;
        case Shield.KiteShield:
          template.levelRange = new NumberRange(6, 8);
          template.acRange = new NumberRange(60, 75);
          template.size = ShieldSize.Medium;
          template.maxDurability = 20;
          template.requirements[CombatAttribute.Strength] = 14;
          template.requirements[CombatAttribute.Dexterity] = 7;
          break;
        case Shield.TowerShield:
          template.levelRange = new NumberRange(7, 10);
          template.acRange = new NumberRange(70, 80);
          template.size = ShieldSize.Large;
          template.maxDurability = 25;
          template.requirements[CombatAttribute.Strength] = 29;
          break;
        case Shield.AncientBuckler:
          template.levelRange = new NumberRange(8, 10);
          template.acRange = new NumberRange(80, 100);
          template.size = ShieldSize.Small;
          template.maxDurability = 28;
          template.requirements[CombatAttribute.Dexterity] = 29;
          template.requirements[CombatAttribute.Strength] = 7;
          break;
        case Shield.GothicShield:
          template.levelRange = new NumberRange(8, 10);
          template.acRange = new NumberRange(85, 110);
          template.size = ShieldSize.Medium;
          template.maxDurability = 30;
          template.requirements[CombatAttribute.Strength] = 29;
          template.requirements[CombatAttribute.Dexterity] = 7;
          break;
      }

      toReturn[shield] = template;
    }

    return toReturn as Record<Shield, ShieldGenerationTemplate>;
  })();
