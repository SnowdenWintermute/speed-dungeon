import {
  AffixCategory,
  AffixType,
  ATTRIBUTE_POINT_ASSIGNABLE_ATTRIBUTES,
  CombatAttribute,
  CombatantClass,
  EquipmentType,
  MonsterType,
  PREFIX_TYPES,
  SUFFIX_TYPES,
  invariant,
  iterateNumericEnum,
} from "@speed-dungeon/common";
import { assembleEnumMemberLookup } from "./workbook-reader.ts";

const REQUIREMENT_COLUMNS: Partial<Record<CombatAttribute, string>> = {
  [CombatAttribute.Strength]: "reqStr",
  [CombatAttribute.Dexterity]: "reqDex",
  [CombatAttribute.Spirit]: "reqSpr",
  [CombatAttribute.Vitality]: "reqVit",
  [CombatAttribute.Agility]: "reqAgi",
};

export function getRequirementColumn(attribute: CombatAttribute) {
  const column = REQUIREMENT_COLUMNS[attribute];
  invariant(column !== undefined, `no requirement column for ${CombatAttribute[attribute]}`);
  return column;
}

export function getAffixColumn(affixCategory: AffixCategory, affixType: AffixType) {
  return `${AffixCategory[affixCategory]}:${AffixType[affixType]}`;
}

const REQUIREMENT_COLUMN_NAMES = ATTRIBUTE_POINT_ASSIGNABLE_ATTRIBUTES.map(getRequirementColumn);

export interface EquipmentSheetSchema {
  name: string;
  impliedType: null | EquipmentType;
  specificColumns: string[];
}

export const EQUIPMENT_SHEETS: EquipmentSheetSchema[] = [
  {
    name: "equipment-weapons",
    impliedType: null,
    specificColumns: ["minDmg", "maxDmg", "damageClassificationsCount", "damageClassifications"],
  },
  {
    name: "equipment-armor",
    impliedType: null,
    specificColumns: ["minAc", "maxAc", "armorCategory"],
  },
  {
    name: "equipment-shields",
    impliedType: EquipmentType.Shield,
    specificColumns: ["minAc", "maxAc", "shieldSize"],
  },
  { name: "equipment-jewelry", impliedType: null, specificColumns: [] },
];

export function getEquipmentSheetColumns(schema: EquipmentSheetSchema) {
  return [
    "baseItem",
    ...(schema.impliedType === null ? ["equipmentType"] : []),
    "affixProfile",
    "minLvl",
    "maxLvl",
    ...schema.specificColumns,
    "maxDura",
    ...REQUIREMENT_COLUMN_NAMES,
  ];
}

export const AFFIX_PROFILES_SHEET = {
  name: "equipment-affix-profiles",
  columns: [
    "affixProfile",
    ...PREFIX_TYPES.map((affixType) => getAffixColumn(AffixCategory.Prefix, affixType)),
    ...SUFFIX_TYPES.map((affixType) => getAffixColumn(AffixCategory.Suffix, affixType)),
  ],
};

export const AFFIX_OVERRIDES_SHEET = {
  name: "equipment-affix-overrides",
  columns: ["baseItem", "affixType", "maxTier"],
};

/**
 * Which build each equipment is meant for, and how deep into its drop curve to read that build from.
 * The reqStr..reqAgi columns on the equipment sheets stay as manual overrides of what this derives.
 */
const STUDY_COLUMN = "study";

/** only meaningful on a row that names a study, so a row with one of these and no study is an error */
const TARGET_COLUMNS = [
  "attributes",
  "goal",
  "weaponSpecialty",
  "mainClass",
  "supportClass",
  "availabilityPercentile",
];

export const REQUIREMENT_TARGETS_SHEET = {
  name: "equipment-requirement-targets",
  studyColumn: STUDY_COLUMN,
  targetColumns: TARGET_COLUMNS,
  columns: ["equipmentType", "baseItem", STUDY_COLUMN, ...TARGET_COLUMNS],
};

/** in supportClass, versus a blank cell meaning "any support class" */
export const NO_SUPPORT_CLASS = "none";

export interface AttributeTableSchema {
  sheetName: string;
  keyColumn: string;
  keyTypeName: string;
  keysByName: Map<string, number>;
  constName: string;
}

export const ATTRIBUTE_TABLE_SCHEMAS: AttributeTableSchema[] = [
  {
    sheetName: "class-starting-attributes",
    keyColumn: "combatantClass",
    keyTypeName: "CombatantClass",
    keysByName: assembleEnumMemberLookup(CombatantClass),
    constName: "BASE_STARTING_ATTRIBUTES",
  },
  {
    sheetName: "class-attributes-per-level",
    keyColumn: "combatantClass",
    keyTypeName: "CombatantClass",
    keysByName: assembleEnumMemberLookup(CombatantClass),
    constName: "COMBATANT_CLASS_ATTRIBUTES_BY_LEVEL",
  },
  {
    sheetName: "monster-starting-attributes",
    keyColumn: "monsterType",
    keyTypeName: "MonsterType",
    keysByName: assembleEnumMemberLookup(MonsterType),
    constName: "MONSTER_STARTING_ATTRIBUTES",
  },
  {
    sheetName: "monster-attributes-per-level",
    keyColumn: "monsterType",
    keyTypeName: "MonsterType",
    keysByName: assembleEnumMemberLookup(MonsterType),
    constName: "MONSTER_ATTRIBUTES_BY_LEVEL",
  },
];

/** every attribute is a column, and a blank cell means the entity has no value for it */
export function getAttributeSheetColumns(schema: AttributeTableSchema) {
  return [
    schema.keyColumn,
    ...iterateNumericEnum(CombatAttribute).map((attribute) => CombatAttribute[attribute]),
  ];
}
