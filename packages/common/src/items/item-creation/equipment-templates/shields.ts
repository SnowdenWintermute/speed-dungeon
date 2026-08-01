import { CombatAttribute } from "../../../combatants/attributes/index.js";
import { NumberRange } from "../../../primatives/number-range.js";
import { iterateNumericEnum } from "../../../utils/index.js";
import { AffixType, PREFIX_TYPES, SUFFIX_TYPES } from "../../equipment/affixes.js";
import { ShieldSize } from "../../equipment/equipment-properties/shield-properties.js";
import { EquipmentType } from "../../equipment/equipment-types/index.js";
import { Shield } from "../../equipment/equipment-types/shield.js";
import { ShieldGenerationTemplate } from "./base-templates.js";

/** the affix defaults the shield templates were built with, kept here only until the csv loader
 * supplies them */
function setShieldPossibleAffixes(template: ShieldGenerationTemplate) {
  for (const prefix of PREFIX_TYPES) {
    switch (prefix) {
      case AffixType.Accuracy:
      case AffixType.PercentDamage:
      case AffixType.LifeSteal:
      case AffixType.ArmorPenetration:
        break;
      case AffixType.Agility:
        template.possibleAffixes.prefix[prefix] = 3;
        break;
      case AffixType.Mp:
      case AffixType.FlatArmorClass:
      case AffixType.Evasion:
        template.possibleAffixes.prefix[prefix] = 5;
    }
  }
  for (const suffix of SUFFIX_TYPES) {
    switch (suffix) {
      case AffixType.FlatDamage:
        break;
      case AffixType.Hp:
      case AffixType.Vitality:
      case AffixType.Strength:
      case AffixType.Spirit:
      case AffixType.Dexterity:
      case AffixType.Durability:
      case AffixType.PercentArmorClass:
        template.possibleAffixes.suffix[suffix] = 5;
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

      setShieldPossibleAffixes(template);

      switch (shield) {
        case Shield.PotLid:
          template.levelRange = new NumberRange(0, 0);
          template.acRange = new NumberRange(2, 2);
          template.size = ShieldSize.Small;
          template.maxDurability = 8;
          break;
        case Shield.CabinetDoor:
          template.levelRange = new NumberRange(1, 3);
          template.acRange = new NumberRange(2, 6);
          template.size = ShieldSize.Small;
          template.maxDurability = 16;
          break;
        case Shield.Heater:
          template.levelRange = new NumberRange(2, 4);
          template.acRange = new NumberRange(10, 18);
          template.size = ShieldSize.Medium;
          template.maxDurability = 22;
          template.requirements[CombatAttribute.Strength] = 3;
          break;
        case Shield.Buckler:
          template.levelRange = new NumberRange(3, 5);
          template.acRange = new NumberRange(20, 32);
          template.size = ShieldSize.Small;
          template.maxDurability = 18;
          template.requirements[CombatAttribute.Strength] = 3;
          template.requirements[CombatAttribute.Dexterity] = 2;
          break;
        case Shield.Pavise:
          template.levelRange = new NumberRange(4, 6);
          template.acRange = new NumberRange(32, 41);
          template.size = ShieldSize.Large;
          template.maxDurability = 20;
          template.requirements[CombatAttribute.Strength] = 7;
          template.requirements[CombatAttribute.Dexterity] = 3;
          break;
        case Shield.Aspis:
          template.levelRange = new NumberRange(5, 7);
          template.acRange = new NumberRange(40, 48);
          template.size = ShieldSize.Medium;
          template.maxDurability = 18;
          template.requirements[CombatAttribute.Strength] = 7;
          template.requirements[CombatAttribute.Dexterity] = 7;
          break;
        case Shield.LanternShield:
          template.levelRange = new NumberRange(5, 6);
          template.acRange = new NumberRange(50, 55);
          template.size = ShieldSize.Small;
          template.maxDurability = 15;
          template.requirements[CombatAttribute.Spirit] = 3;
          template.requirements[CombatAttribute.Dexterity] = 7;
          template.possibleAffixes.suffix[AffixType.FlatDamage] = 5;
          break;
        case Shield.KiteShield:
          template.levelRange = new NumberRange(6, 8);
          template.acRange = new NumberRange(60, 75);
          template.size = ShieldSize.Medium;
          template.maxDurability = 24;
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
          template.maxDurability = 28;
          template.requirements[CombatAttribute.Strength] = 29;
          template.requirements[CombatAttribute.Dexterity] = 7;
          break;
      }

      toReturn[shield] = template;
    }

    return toReturn as Record<Shield, ShieldGenerationTemplate>;
  })();
