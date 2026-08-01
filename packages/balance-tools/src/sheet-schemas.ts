import {
  AffixCategory,
  AffixType,
  ATTRIBUTE_POINT_ASSIGNABLE_ATTRIBUTES,
  CombatAttribute,
  EquipmentType,
  PREFIX_TYPES,
  SUFFIX_TYPES,
  invariant,
} from "@speed-dungeon/common";

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

/** in the workbook and tuned there, but nothing consumes them yet — the combatant and monster
 * attribute tables are still hardcoded in common */
export const NOT_YET_CONSUMED_SHEETS = [
  "class-starting-attributes",
  "class-attributes-per-level",
  "monster-starting-attributes",
  "monster-attributes-per-level",
];
