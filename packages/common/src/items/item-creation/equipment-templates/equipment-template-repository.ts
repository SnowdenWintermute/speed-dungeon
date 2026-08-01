import { ResourceChangeSource } from "../../../combat/hp-change-source-types.js";
import { CombatAttribute } from "../../../combatants/attributes/index.js";
import { ERROR_MESSAGES } from "../../../errors/index.js";
import { NumberRange } from "../../../primatives/number-range.js";
import { invariant } from "../../../utils/index.js";
import { PrefixType, SuffixType } from "../../equipment/affixes.js";
import { ArmorCategory } from "../../equipment/equipment-properties/armor-properties.js";
import { ShieldSize } from "../../equipment/equipment-properties/shield-properties.js";
import { EquipmentBaseItem, EquipmentType } from "../../equipment/equipment-types/index.js";
import {
  ArmorGenerationTemplate,
  EquipmentGenerationTemplate,
  ShieldGenerationTemplate,
  WeaponGenerationTemplate,
} from "./base-templates.js";

/** the flat shape a parsed row of game data arrives in. whoever reads the csvs owns validating it —
 * by the time it gets here the enums are resolved and the numbers are numbers */
export interface EquipmentTemplateSpec {
  baseItem: EquipmentBaseItem;
  levelRange: NumberRange;
  maxDurability: null | number;
  requirements: Partial<Record<CombatAttribute, number>>;
  possibleAffixes: {
    prefix: Partial<Record<PrefixType, number>>;
    suffix: Partial<Record<SuffixType, number>>;
  };
  damage: null | NumberRange;
  damageClassificationsCount: null | number;
  damageClassifications: ResourceChangeSource[];
  armorClass: null | NumberRange;
  armorCategory: null | ArmorCategory;
  shieldSize: null | ShieldSize;
}

export class EquipmentTemplateRepository {
  private templatesByType: Record<EquipmentType, Map<number, EquipmentGenerationTemplate>> = {
    [EquipmentType.BodyArmor]: new Map(),
    [EquipmentType.HeadGear]: new Map(),
    [EquipmentType.Ring]: new Map(),
    [EquipmentType.Amulet]: new Map(),
    [EquipmentType.OneHandedMeleeWeapon]: new Map(),
    [EquipmentType.TwoHandedMeleeWeapon]: new Map(),
    [EquipmentType.TwoHandedRangedWeapon]: new Map(),
    [EquipmentType.Shield]: new Map(),
  };

  constructor(specs: EquipmentTemplateSpec[]) {
    for (const spec of specs) {
      const { equipmentType, baseItemType } = spec.baseItem;
      this.templatesByType[equipmentType].set(baseItemType, buildTemplate(spec));
    }
  }

  getTemplate(baseItem: EquipmentBaseItem): EquipmentGenerationTemplate {
    const template = this.templatesByType[baseItem.equipmentType].get(baseItem.baseItemType);
    invariant(
      template !== undefined,
      `${ERROR_MESSAGES.ITEM.INVALID_PROPERTIES}: no generation template for ${
        EquipmentType[baseItem.equipmentType]
      } ${baseItem.baseItemType}`
    );
    return template;
  }
}

function describeBaseItem(baseItem: EquipmentBaseItem) {
  return `${EquipmentType[baseItem.equipmentType]} ${baseItem.baseItemType}`;
}

function buildTemplate(spec: EquipmentTemplateSpec) {
  const template = buildTemplateOfType(spec);

  template.levelRange = spec.levelRange;
  template.maxDurability = spec.maxDurability;
  template.requirements = spec.requirements;
  template.possibleAffixes = spec.possibleAffixes;

  return template;
}

function buildTemplateOfType(spec: EquipmentTemplateSpec): EquipmentGenerationTemplate {
  const { baseItem } = spec;

  switch (baseItem.equipmentType) {
    case EquipmentType.OneHandedMeleeWeapon:
    case EquipmentType.TwoHandedMeleeWeapon:
    case EquipmentType.TwoHandedRangedWeapon: {
      const { damage, damageClassificationsCount } = spec;
      invariant(damage !== null, `weapon ${describeBaseItem(baseItem)} has no damage range`);
      const template = new WeaponGenerationTemplate(
        damage,
        spec.damageClassifications,
        baseItem
      );
      if (damageClassificationsCount !== null) {
        template.damageClassificationsCount = damageClassificationsCount;
      }
      return template;
    }
    case EquipmentType.BodyArmor:
    case EquipmentType.HeadGear: {
      const { armorClass, armorCategory } = spec;
      invariant(armorClass !== null, `armor ${describeBaseItem(baseItem)} has no armor class range`);
      invariant(armorCategory !== null, `armor ${describeBaseItem(baseItem)} has no armor category`);
      return new ArmorGenerationTemplate(armorClass, armorCategory, baseItem);
    }
    case EquipmentType.Shield: {
      const { armorClass, shieldSize } = spec;
      invariant(armorClass !== null, `shield ${describeBaseItem(baseItem)} has no armor class range`);
      invariant(shieldSize !== null, `shield ${describeBaseItem(baseItem)} has no size`);
      return new ShieldGenerationTemplate(armorClass, shieldSize, baseItem);
    }
    case EquipmentType.Ring:
    case EquipmentType.Amulet:
      return new EquipmentGenerationTemplate(baseItem);
  }
}
