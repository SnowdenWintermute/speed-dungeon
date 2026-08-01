import { DEEPEST_FLOOR } from "../../../app-consts.js";
import {
  ResourceChangeSource,
  ResourceChangeSourceConfig,
} from "../../../combat/hp-change-source-types.js";
import { CombatAttribute } from "../../../combatants/attributes/index.js";
import { ERROR_MESSAGES } from "../../../errors/index.js";
import { NumberRange } from "../../../primatives/number-range.js";
import { invariant, iterateNumericEnumKeyedRecord } from "../../../utils/index.js";
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
import { EQUIPMENT_TEMPLATE_SPECS } from "./game-data.generated.js";

/** the compiler checks this shape; the repository checks the things a type cannot express */
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

export class EquipmentTemplateCatalog {
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
      assertSpecIsCoherent(spec);
      const { equipmentType, baseItemType } = spec.baseItem;
      invariant(
        !this.templatesByType[equipmentType].has(baseItemType),
        `${describeBaseItem(spec.baseItem)} has more than one game data entry`
      );
      this.templatesByType[equipmentType].set(baseItemType, assembleTemplate(spec));
    }
  }

  getTemplate(baseItem: EquipmentBaseItem): EquipmentGenerationTemplate {
    const template = this.templatesByType[baseItem.equipmentType].get(baseItem.baseItemType);
    invariant(
      template !== undefined,
      `${ERROR_MESSAGES.ITEM.INVALID_PROPERTIES}: no generation template for ${describeBaseItem(
        baseItem
      )}`
    );
    return template;
  }
}

let catalog: null | EquipmentTemplateCatalog = null;

/** built on first use rather than at module scope: importing anything from common should not run
 * game data validation */
export function getEquipmentTemplateCatalog() {
  if (catalog === null) {
    catalog = new EquipmentTemplateCatalog(EQUIPMENT_TEMPLATE_SPECS);
  }
  return catalog;
}

function describeBaseItem(baseItem: EquipmentBaseItem) {
  return `${EquipmentType[baseItem.equipmentType]} ${baseItem.baseItemType}`;
}

/** what the compiler cannot check about a hand authored spreadsheet: that its numbers relate to each
 * other sanely. a zero to zero damage range is legal — an inverted one is not */
function assertSpecIsCoherent(spec: EquipmentTemplateSpec) {
  const name = describeBaseItem(spec.baseItem);

  assertRangeIsValid(spec.levelRange, `${name} level range`);
  invariant(
    spec.levelRange.min >= 0 && spec.levelRange.max <= DEEPEST_FLOOR,
    `${name} level range ${spec.levelRange.min}-${spec.levelRange.max} falls outside floors 0-${DEEPEST_FLOOR}`
  );

  if (spec.damage !== null) {
    assertRangeIsValid(spec.damage, `${name} damage range`);
  }
  if (spec.armorClass !== null) {
    assertRangeIsValid(spec.armorClass, `${name} armor class range`);
  }
  if (spec.maxDurability !== null) {
    invariant(spec.maxDurability > 0, `${name} has a max durability of ${spec.maxDurability}`);
  }

  for (const [, maxTier] of iterateNumericEnumKeyedRecord(spec.possibleAffixes.prefix)) {
    assertAffixTierIsRollable(maxTier, name);
  }
  for (const [, maxTier] of iterateNumericEnumKeyedRecord(spec.possibleAffixes.suffix)) {
    assertAffixTierIsRollable(maxTier, name);
  }
}

function assertRangeIsValid(range: NumberRange, description: string) {
  invariant(range.isValid(), `${description} is inverted: ${range.min}-${range.max}`);
}

/** rollAffixTier floors its result at 1, so a zero or negative max tier would silently roll as 1
 * rather than reading as the typo it is */
function assertAffixTierIsRollable(maxTier: number, name: string) {
  invariant(maxTier >= 1, `${name} has an affix max tier of ${maxTier}`);
}

function assembleTemplate(spec: EquipmentTemplateSpec) {
  const template = assembleTemplateOfType(spec);

  template.levelRange = spec.levelRange;
  template.maxDurability = spec.maxDurability;
  template.requirements = spec.requirements;
  template.possibleAffixes = spec.possibleAffixes;

  return template;
}

function assembleTemplateOfType(spec: EquipmentTemplateSpec): EquipmentGenerationTemplate {
  const { baseItem } = spec;
  const name = describeBaseItem(baseItem);

  switch (baseItem.equipmentType) {
    case EquipmentType.OneHandedMeleeWeapon:
    case EquipmentType.TwoHandedMeleeWeapon:
    case EquipmentType.TwoHandedRangedWeapon: {
      const { damage, damageClassificationsCount } = spec;
      invariant(damage !== null, `weapon ${name} has no damage range`);
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
      invariant(armorClass !== null, `armor ${name} has no armor class range`);
      invariant(armorCategory !== null, `armor ${name} has no armor category`);
      return new ArmorGenerationTemplate(armorClass, armorCategory, baseItem);
    }
    case EquipmentType.Shield: {
      const { armorClass, shieldSize } = spec;
      invariant(armorClass !== null, `shield ${name} has no armor class range`);
      invariant(shieldSize !== null, `shield ${name} has no size`);
      return new ShieldGenerationTemplate(armorClass, shieldSize, baseItem);
    }
    case EquipmentType.Ring:
    case EquipmentType.Amulet:
      return new EquipmentGenerationTemplate(baseItem);
  }
}
