import ExcelJS from "exceljs";
import {
  AffixCategory,
  AffixType,
  ATTRIBUTE_POINT_ASSIGNABLE_ATTRIBUTES,
  CombatAttribute,
  EquipmentType,
  NumberRange,
  PREFIX_TYPES,
  SUFFIX_TYPES,
  invariant,
  iterateNumericEnum,
} from "@speed-dungeon/common";
import type { EquipmentTemplateSpec, PrefixType, SuffixType } from "@speed-dungeon/common";
import {
  AFFIX_OVERRIDES_SHEET,
  AFFIX_PROFILES_SHEET,
  EQUIPMENT_SHEETS,
  getAffixColumn,
  getEquipmentSheetColumns,
  getRequirementColumn,
} from "./sheet-schemas.ts";
import {
  AFFIX_TYPES_BY_NAME,
  ARMOR_CATEGORIES_BY_NAME,
  BASE_ITEMS_BY_NAME,
  EQUIPMENT_TYPES_BY_NAME,
  isPrefixType,
  SHIELD_SIZES_BY_NAME,
  parseBaseItem,
  parseDamageClassifications,
} from "./enum-lookups.ts";
import { readSheet } from "./workbook-reader.ts";

const CANNOT_ROLL = "x";

interface PossibleAffixes {
  prefix: Partial<Record<PrefixType, number>>;
  suffix: Partial<Record<SuffixType, number>>;
}

export function assembleEquipmentSpecs(workbook: ExcelJS.Workbook): EquipmentTemplateSpec[] {
  const profilesByName = readAffixProfiles(workbook);
  const specs: EquipmentTemplateSpec[] = [];
  const resolvedByBaseItem = new Map<string, PossibleAffixes>();

  for (const schema of EQUIPMENT_SHEETS) {
    for (const row of readSheet(workbook, schema.name, getEquipmentSheetColumns(schema))) {
      const baseItemName = row.getText("baseItem");
      const describeRow = row.describe();
      const equipmentType =
        schema.impliedType ?? row.getEnumMember("equipmentType", EQUIPMENT_TYPES_BY_NAME);

      const profileName = row.getText("affixProfile");
      const profile = profilesByName.get(profileName);
      invariant(
        profile !== undefined,
        `${describeRow}: affix profile "${profileName}" is not defined on ${AFFIX_PROFILES_SHEET.name}`
      );

      invariant(
        !resolvedByBaseItem.has(baseItemName),
        `${describeRow}: "${baseItemName}" appears on more than one row`
      );
      const possibleAffixes: PossibleAffixes = {
        prefix: { ...profile.prefix },
        suffix: { ...profile.suffix },
      };
      resolvedByBaseItem.set(baseItemName, possibleAffixes);

      const isWeapon = schema.specificColumns.includes("minDmg");
      const hasArmorClass = schema.specificColumns.includes("minAc");
      const levelRange = new NumberRange(row.getNumber("minLvl"), row.getNumber("maxLvl"));
      assertRangeIsValid(levelRange, `${describeRow}: level range`);

      const damage = isWeapon
        ? new NumberRange(row.getNumber("minDmg"), row.getNumber("maxDmg"))
        : null;
      if (damage !== null) {
        assertRangeIsValid(damage, `${describeRow}: damage range`);
      }

      const armorClass = hasArmorClass
        ? new NumberRange(row.getNumber("minAc"), row.getNumber("maxAc"))
        : null;
      if (armorClass !== null) {
        assertRangeIsValid(armorClass, `${describeRow}: armor class range`);
      }

      specs.push({
        baseItem: parseBaseItem(equipmentType, row),
        levelRange,
        maxDurability: row.getNumberOption("maxDura"),
        requirements: readRequirements(row),
        possibleAffixes,
        damage,
        damageClassificationsCount: isWeapon
          ? row.getNumberOption("damageClassificationsCount")
          : null,
        damageClassifications: isWeapon
          ? parseDamageClassifications(row.getText("damageClassifications"), describeRow)
          : [],
        armorClass,
        armorCategory: schema.specificColumns.includes("armorCategory")
          ? row.getEnumMember("armorCategory", ARMOR_CATEGORIES_BY_NAME)
          : null,
        shieldSize: schema.specificColumns.includes("shieldSize")
          ? row.getEnumMember("shieldSize", SHIELD_SIZES_BY_NAME)
          : null,
      });
    }
  }

  applyOverrides(workbook, resolvedByBaseItem);
  assertEveryBaseItemCovered(specs);
  return specs;
}

/** caught here as well as at boot, because here the message can name the sheet and row you would
 * have to go and fix */
function assertRangeIsValid(range: NumberRange, description: string) {
  invariant(range.isValid(), `${description} is inverted: ${range.min}-${range.max}`);
}

function readRequirements(row: { getNumberOption: (column: string) => null | number }) {
  const requirements: Partial<Record<CombatAttribute, number>> = {};
  for (const attribute of ATTRIBUTE_POINT_ASSIGNABLE_ATTRIBUTES) {
    const value = row.getNumberOption(getRequirementColumn(attribute));
    if (value !== null) {
      requirements[attribute] = value;
    }
  }
  return requirements;
}

function readAffixProfiles(workbook: ExcelJS.Workbook) {
  const profilesByName = new Map<string, PossibleAffixes>();

  for (const row of readSheet(workbook, AFFIX_PROFILES_SHEET.name, AFFIX_PROFILES_SHEET.columns)) {
    const name = row.getText("affixProfile");
    invariant(!profilesByName.has(name), `${row.describe()}: duplicate affix profile "${name}"`);

    const possibleAffixes: PossibleAffixes = { prefix: {}, suffix: {} };
    for (const affixType of PREFIX_TYPES) {
      const maxTier = row.getNumberOption(getAffixColumn(AffixCategory.Prefix, affixType));
      if (maxTier !== null) {
        possibleAffixes.prefix[affixType] = maxTier;
      }
    }
    for (const affixType of SUFFIX_TYPES) {
      const maxTier = row.getNumberOption(getAffixColumn(AffixCategory.Suffix, affixType));
      if (maxTier !== null) {
        possibleAffixes.suffix[affixType] = maxTier;
      }
    }
    profilesByName.set(name, possibleAffixes);
  }

  return profilesByName;
}

function applyOverrides(
  workbook: ExcelJS.Workbook,
  resolvedByBaseItem: Map<string, PossibleAffixes>
) {
  for (const row of readSheet(workbook, AFFIX_OVERRIDES_SHEET.name, AFFIX_OVERRIDES_SHEET.columns)) {
    const baseItem = row.getText("baseItem");
    const resolved = resolvedByBaseItem.get(baseItem);
    invariant(
      resolved !== undefined,
      `${row.describe()}: "${baseItem}" has no row on any equipment sheet`
    );

    const typeName = row.getText("affixType");
    const affixType = AFFIX_TYPES_BY_NAME.get(typeName);
    invariant(affixType !== undefined, `${row.describe()}: "${typeName}" is not an affix type`);

    const maxTierText = row.getText("maxTier");
    const maxTier = maxTierText === CANNOT_ROLL ? null : row.getNumber("maxTier");

    if (isPrefixType(affixType)) {
      applyMaxTier(resolved.prefix, affixType, maxTier);
    } else {
      applyMaxTier(resolved.suffix, affixType, maxTier);
    }
  }
}

function applyMaxTier<T extends AffixType>(
  maxTiers: Partial<Record<T, number>>,
  affixType: T,
  maxTier: null | number
) {
  if (maxTier === null) {
    delete maxTiers[affixType];
  } else {
    maxTiers[affixType] = maxTier;
  }
}

function assertEveryBaseItemCovered(specs: EquipmentTemplateSpec[]) {
  const seen = new Map<EquipmentType, Set<number>>();
  for (const spec of specs) {
    const { equipmentType, baseItemType } = spec.baseItem;
    const seenOfType = seen.get(equipmentType) ?? new Set<number>();
    seenOfType.add(baseItemType);
    seen.set(equipmentType, seenOfType);
  }

  for (const equipmentType of iterateNumericEnum(EquipmentType)) {
    const seenOfType = seen.get(equipmentType) ?? new Set<number>();
    const missing = [...BASE_ITEMS_BY_NAME[equipmentType].entries()]
      .filter(([, baseItemType]) => !seenOfType.has(baseItemType))
      .map(([name]) => name);
    invariant(
      missing.length === 0,
      `${EquipmentType[equipmentType]} has no workbook row for: ${missing.join(", ")}`
    );
  }
}
