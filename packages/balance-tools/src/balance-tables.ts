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
    ...EQUIPMENT_TABLE_CONFIGS.map((config) => buildEquipmentTable(config, equipmentRows)),
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

/** not derivable from the enum member names — Spirit abbreviates to Spr, not Spi */
const REQUIREMENT_COLUMNS: Partial<Record<CombatAttribute, string>> = {
  [CombatAttribute.Strength]: "reqStr",
  [CombatAttribute.Dexterity]: "reqDex",
  [CombatAttribute.Spirit]: "reqSpr",
  [CombatAttribute.Vitality]: "reqVit",
  [CombatAttribute.Agility]: "reqAgi",
};

function getRequirementColumn(attribute: CombatAttribute) {
  const column = REQUIREMENT_COLUMNS[attribute];
  invariant(column !== undefined, `no requirement column for ${CombatAttribute[attribute]}`);
  return column;
}

type EquipmentRow = ReturnType<typeof collectEquipmentTemplateRows>[number];

/** one sheet per property shape rather than per equipment type, so a sheet carries no column its
 * rows leave blank while every weapon still sits on one sheet to be compared against the others.
 * a sheet covering a single equipment type has nothing to say in an equipmentType column */
interface EquipmentTableConfig {
  name: string;
  equipmentTypes: EquipmentType[];
  specificColumns: string[];
  getSpecificCells: (equipmentRow: EquipmentRow) => Record<string, BalanceCell>;
}

const EQUIPMENT_TABLE_CONFIGS: EquipmentTableConfig[] = [
  {
    name: "equipment-weapons",
    equipmentTypes: [
      EquipmentType.OneHandedMeleeWeapon,
      EquipmentType.TwoHandedMeleeWeapon,
      EquipmentType.TwoHandedRangedWeapon,
    ],
    specificColumns: [
      "minDmg",
      "maxDmg",
      "damageClassificationsCount",
      "damageClassifications",
    ],
    getSpecificCells: ({ damage, damageClassificationsCount, damageClassifications }) => ({
      minDmg: damage === null ? null : damage.min,
      maxDmg: damage === null ? null : damage.max,
      damageClassificationsCount,
      damageClassifications:
        damageClassifications === null
          ? null
          : serializeDamageClassifications(damageClassifications),
    }),
  },
  {
    name: "equipment-armor",
    equipmentTypes: [EquipmentType.BodyArmor, EquipmentType.HeadGear],
    specificColumns: ["minAc", "maxAc", "armorCategory"],
    getSpecificCells: ({ armorClass, armorCategory }) => ({
      minAc: armorClass === null ? null : armorClass.min,
      maxAc: armorClass === null ? null : armorClass.max,
      armorCategory: armorCategory === null ? null : ArmorCategory[armorCategory],
    }),
  },
  {
    name: "equipment-shields",
    equipmentTypes: [EquipmentType.Shield],
    specificColumns: ["minAc", "maxAc", "shieldSize"],
    getSpecificCells: ({ armorClass, shieldSize }) => ({
      minAc: armorClass === null ? null : armorClass.min,
      maxAc: armorClass === null ? null : armorClass.max,
      shieldSize: shieldSize === null ? null : ShieldSize[shieldSize],
    }),
  },
  {
    name: "equipment-jewelry",
    equipmentTypes: [EquipmentType.Ring, EquipmentType.Amulet],
    specificColumns: [],
    getSpecificCells: () => ({}),
  },
];

function buildEquipmentTable(
  config: EquipmentTableConfig,
  equipmentRows: EquipmentRow[]
): BalanceTable {
  const coversOneType = config.equipmentTypes.length === 1;
  const requirementColumns = ATTRIBUTE_POINT_ASSIGNABLE_ATTRIBUTES.map(getRequirementColumn);

  const rows = equipmentRows
    .filter((equipmentRow) => config.equipmentTypes.includes(equipmentRow.equipmentType))
    .map((equipmentRow) => {
      const { requirements } = equipmentRow;

      for (const [attribute] of iterateNumericEnumKeyedRecord(requirements)) {
        invariant(
          ATTRIBUTE_POINT_ASSIGNABLE_ATTRIBUTES.includes(attribute),
          `${equipmentRow.baseItem} requires ${CombatAttribute[attribute]}, which has no column`
        );
      }

      const row: Record<string, BalanceCell> = {
        baseItem: equipmentRow.baseItem,
        affixProfile: equipmentRow.affixProfile,
        minLvl: equipmentRow.levelRange.min,
        maxLvl: equipmentRow.levelRange.max,
        ...config.getSpecificCells(equipmentRow),
        maxDura: equipmentRow.maxDurability,
      };

      if (!coversOneType) {
        row["equipmentType"] = EquipmentType[equipmentRow.equipmentType];
      }

      for (const attribute of ATTRIBUTE_POINT_ASSIGNABLE_ATTRIBUTES) {
        row[getRequirementColumn(attribute)] = requirements[attribute] ?? null;
      }

      return row;
    });

  return {
    name: config.name,
    columns: [
      "baseItem",
      ...(coversOneType ? [] : ["equipmentType"]),
      "affixProfile",
      "minLvl",
      "maxLvl",
      ...config.specificColumns,
      "maxDura",
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
