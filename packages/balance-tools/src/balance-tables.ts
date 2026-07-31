import {
  AffixCategory,
  AffixType,
  ATTRIBUTE_POINT_ASSIGNABLE_ATTRIBUTES,
  ArmorCategory,
  BASE_STARTING_ATTRIBUTES,
  COMBATANT_CLASS_ATTRIBUTES_BY_LEVEL,
  CombatAttribute,
  CombatantClass,
  EquipmentType,
  MONSTER_ATTRIBUTES_BY_LEVEL,
  MONSTER_STARTING_ATTRIBUTES,
  MonsterType,
  PREFIX_TYPES,
  SUFFIX_TYPES,
  ShieldSize,
  invariant,
  iterateNumericEnum,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import { deriveAffixProfiles } from "./affix-profiles.ts";
import {
  collectEquipmentTemplateRows,
  serializeDamageClassifications,
} from "./equipment-template-rows.ts";

export type BalanceCell = string | number | null;

export interface BalanceTable {
  name: string;
  columns: string[];
  rows: Record<string, BalanceCell>[];
}

/** marks an affix a base item cannot roll even though its profile grants one */
const CANNOT_ROLL = "x";

export function buildBalanceTables(): BalanceTable[] {
  const equipmentRows = collectEquipmentTemplateRows();
  const { profiles, overrides } = deriveAffixProfiles(equipmentRows);

  return [
    buildEquipmentBaseItemsTable(equipmentRows),
    buildAffixProfilesTable(profiles),
    buildAffixOverridesTable(overrides),
    buildAttributesTable({
      name: "class-starting-attributes",
      keyColumn: "combatantClass",
      keys: iterateNumericEnum(CombatantClass),
      getKeyName: (combatantClass) => CombatantClass[combatantClass],
      attributesByKey: BASE_STARTING_ATTRIBUTES,
    }),
    buildAttributesTable({
      name: "class-attributes-per-level",
      keyColumn: "combatantClass",
      keys: iterateNumericEnum(CombatantClass),
      getKeyName: (combatantClass) => CombatantClass[combatantClass],
      attributesByKey: COMBATANT_CLASS_ATTRIBUTES_BY_LEVEL,
    }),
    buildAttributesTable({
      name: "monster-starting-attributes",
      keyColumn: "monsterType",
      keys: iterateNumericEnum(MonsterType),
      getKeyName: (monsterType) => MonsterType[monsterType],
      attributesByKey: MONSTER_STARTING_ATTRIBUTES,
    }),
    buildAttributesTable({
      name: "monster-attributes-per-level",
      keyColumn: "monsterType",
      keys: iterateNumericEnum(MonsterType),
      getKeyName: (monsterType) => MonsterType[monsterType],
      attributesByKey: MONSTER_ATTRIBUTES_BY_LEVEL,
    }),
  ];
}

function getRequirementColumn(attribute: CombatAttribute) {
  return `requires${CombatAttribute[attribute]}`;
}

function buildEquipmentBaseItemsTable(
  equipmentRows: ReturnType<typeof collectEquipmentTemplateRows>
): BalanceTable {
  const requirementColumns = ATTRIBUTE_POINT_ASSIGNABLE_ATTRIBUTES.map(getRequirementColumn);

  const rows = equipmentRows.map((equipmentRow) => {
    const {
      requirements,
      damage,
      damageClassifications,
      armorClass,
      armorCategory,
      shieldSize,
    } = equipmentRow;

    for (const [attribute] of iterateNumericEnumKeyedRecord(requirements)) {
      invariant(
        ATTRIBUTE_POINT_ASSIGNABLE_ATTRIBUTES.includes(attribute),
        `${equipmentRow.baseItem} requires ${CombatAttribute[attribute]}, which has no column`
      );
    }

    const row: Record<string, BalanceCell> = {
      baseItem: equipmentRow.baseItem,
      equipmentType: EquipmentType[equipmentRow.equipmentType],
      affixProfile: equipmentRow.affixProfile,
      minLevel: equipmentRow.levelRange.min,
      maxLevel: equipmentRow.levelRange.max,
      minDamage: damage === null ? null : damage.min,
      maxDamage: damage === null ? null : damage.max,
      numDamageClassifications: equipmentRow.numDamageClassifications,
      damageClassifications:
        damageClassifications === null
          ? null
          : serializeDamageClassifications(damageClassifications),
      minArmorClass: armorClass === null ? null : armorClass.min,
      maxArmorClass: armorClass === null ? null : armorClass.max,
      armorCategory: armorCategory === null ? null : ArmorCategory[armorCategory],
      shieldSize: shieldSize === null ? null : ShieldSize[shieldSize],
      maxDurability: equipmentRow.maxDurability,
    };

    for (const attribute of ATTRIBUTE_POINT_ASSIGNABLE_ATTRIBUTES) {
      row[getRequirementColumn(attribute)] = requirements[attribute] ?? null;
    }

    return row;
  });

  return {
    name: "equipment-base-items",
    columns: [
      "baseItem",
      "equipmentType",
      "affixProfile",
      "minLevel",
      "maxLevel",
      "minDamage",
      "maxDamage",
      "numDamageClassifications",
      "damageClassifications",
      "minArmorClass",
      "maxArmorClass",
      "armorCategory",
      "shieldSize",
      "maxDurability",
      ...requirementColumns,
    ],
    rows,
  };
}

function getAffixColumn(affixCategory: AffixCategory, affixType: AffixType) {
  return `${AffixCategory[affixCategory]}:${AffixType[affixType]}`;
}

function buildAffixProfilesTable(
  profiles: ReturnType<typeof deriveAffixProfiles>["profiles"]
): BalanceTable {
  const affixColumns = [
    ...PREFIX_TYPES.map((affixType) => getAffixColumn(AffixCategory.Prefix, affixType)),
    ...SUFFIX_TYPES.map((affixType) => getAffixColumn(AffixCategory.Suffix, affixType)),
  ];

  const rows = profiles.map((profile) => {
    const row: Record<string, BalanceCell> = { affixProfile: profile.name };
    for (const affixType of PREFIX_TYPES) {
      row[getAffixColumn(AffixCategory.Prefix, affixType)] =
        profile.maxTiers[AffixCategory.Prefix][affixType] ?? null;
    }
    for (const affixType of SUFFIX_TYPES) {
      row[getAffixColumn(AffixCategory.Suffix, affixType)] =
        profile.maxTiers[AffixCategory.Suffix][affixType] ?? null;
    }
    return row;
  });

  return { name: "equipment-affix-profiles", columns: ["affixProfile", ...affixColumns], rows };
}

function buildAffixOverridesTable(
  overrides: ReturnType<typeof deriveAffixProfiles>["overrides"]
): BalanceTable {
  return {
    name: "equipment-affix-overrides",
    columns: ["baseItem", "affixCategory", "affixType", "maxTier"],
    rows: overrides.map((override) => ({
      baseItem: override.baseItem,
      affixCategory: AffixCategory[override.affixCategory],
      affixType: AffixType[override.affixType],
      maxTier: override.maxTier ?? CANNOT_ROLL,
    })),
  };
}

interface AttributesTableConfig<T extends number> {
  name: string;
  keyColumn: string;
  keys: T[];
  getKeyName: (key: T) => string;
  attributesByKey: Record<T, Partial<Record<CombatAttribute, number>>>;
}

function buildAttributesTable<T extends number>({
  name,
  keyColumn,
  keys,
  getKeyName,
  attributesByKey,
}: AttributesTableConfig<T>): BalanceTable {
  const attributes = iterateNumericEnum(CombatAttribute);

  const rows = keys.map((key) => {
    const row: Record<string, BalanceCell> = { [keyColumn]: getKeyName(key) };
    for (const attribute of attributes) {
      row[CombatAttribute[attribute]] = attributesByKey[key][attribute] ?? null;
    }
    return row;
  });

  return {
    name,
    columns: [keyColumn, ...attributes.map((attribute) => CombatAttribute[attribute])],
    rows,
  };
}
