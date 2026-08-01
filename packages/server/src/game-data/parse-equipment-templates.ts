import {
  ATTRIBUTE_POINT_ASSIGNABLE_ATTRIBUTES,
  Amulet,
  ArmorCategory,
  BodyArmor,
  CombatAttribute,
  EquipmentType,
  HeadGear,
  KineticDamageType,
  MagicalElement,
  NumberRange,
  OneHandedMeleeWeapon,
  ResourceChangeSource,
  ResourceChangeSourceCategory,
  Ring,
  Shield,
  ShieldSize,
  TwoHandedMeleeWeapon,
  TwoHandedRangedWeapon,
  invariant,
  iterateNumericEnum,
} from "@speed-dungeon/common";
import type { EquipmentBaseItem, EquipmentTemplateSpec } from "@speed-dungeon/common";
import { CsvRow, assembleEnumMemberLookup, readCsvTable } from "./csv-table-reader.js";
import { AffixProfileResolver } from "./parse-affix-profiles.js";

const ABSENT_SEGMENT = "none";

const EQUIPMENT_TYPES_BY_NAME = assembleEnumMemberLookup(
  iterateNumericEnum(EquipmentType),
  (equipmentType) => EquipmentType[equipmentType]
);
const ARMOR_CATEGORIES_BY_NAME = assembleEnumMemberLookup(
  iterateNumericEnum(ArmorCategory),
  (armorCategory) => ArmorCategory[armorCategory]
);
const SHIELD_SIZES_BY_NAME = assembleEnumMemberLookup(
  iterateNumericEnum(ShieldSize),
  (shieldSize) => ShieldSize[shieldSize]
);
const SOURCE_CATEGORIES_BY_NAME = assembleEnumMemberLookup(
  iterateNumericEnum(ResourceChangeSourceCategory),
  (category) => ResourceChangeSourceCategory[category]
);
const KINETIC_TYPES_BY_NAME = assembleEnumMemberLookup(
  iterateNumericEnum(KineticDamageType),
  (kineticType) => KineticDamageType[kineticType]
);
const ELEMENTS_BY_NAME = assembleEnumMemberLookup(
  iterateNumericEnum(MagicalElement),
  (element) => MagicalElement[element]
);

const BODY_ARMOR_BY_NAME = assembleEnumMemberLookup(
  iterateNumericEnum(BodyArmor),
  (baseItem) => BodyArmor[baseItem]
);
const HEAD_GEAR_BY_NAME = assembleEnumMemberLookup(
  iterateNumericEnum(HeadGear),
  (baseItem) => HeadGear[baseItem]
);
const ONE_HANDED_MELEE_BY_NAME = assembleEnumMemberLookup(
  iterateNumericEnum(OneHandedMeleeWeapon),
  (baseItem) => OneHandedMeleeWeapon[baseItem]
);
const TWO_HANDED_MELEE_BY_NAME = assembleEnumMemberLookup(
  iterateNumericEnum(TwoHandedMeleeWeapon),
  (baseItem) => TwoHandedMeleeWeapon[baseItem]
);
const TWO_HANDED_RANGED_BY_NAME = assembleEnumMemberLookup(
  iterateNumericEnum(TwoHandedRangedWeapon),
  (baseItem) => TwoHandedRangedWeapon[baseItem]
);
const SHIELDS_BY_NAME = assembleEnumMemberLookup(
  iterateNumericEnum(Shield),
  (baseItem) => Shield[baseItem]
);
const RINGS_BY_NAME = assembleEnumMemberLookup(
  iterateNumericEnum(Ring),
  (baseItem) => Ring[baseItem]
);
const AMULETS_BY_NAME = assembleEnumMemberLookup(
  iterateNumericEnum(Amulet),
  (baseItem) => Amulet[baseItem]
);

/** widened for the coverage check, which only counts members. constructing a tagged base item still
 * goes through the switch, which is what keeps the type paired with its enum */
const BASE_ITEMS_BY_NAME: Record<EquipmentType, Map<string, number>> = {
  [EquipmentType.BodyArmor]: BODY_ARMOR_BY_NAME,
  [EquipmentType.HeadGear]: HEAD_GEAR_BY_NAME,
  [EquipmentType.OneHandedMeleeWeapon]: ONE_HANDED_MELEE_BY_NAME,
  [EquipmentType.TwoHandedMeleeWeapon]: TWO_HANDED_MELEE_BY_NAME,
  [EquipmentType.TwoHandedRangedWeapon]: TWO_HANDED_RANGED_BY_NAME,
  [EquipmentType.Shield]: SHIELDS_BY_NAME,
  [EquipmentType.Ring]: RINGS_BY_NAME,
  [EquipmentType.Amulet]: AMULETS_BY_NAME,
};

function parseBaseItem(equipmentType: EquipmentType, row: CsvRow): EquipmentBaseItem {
  switch (equipmentType) {
    case EquipmentType.BodyArmor:
      return { equipmentType, baseItemType: row.getEnumMember("baseItem", BODY_ARMOR_BY_NAME) };
    case EquipmentType.HeadGear:
      return { equipmentType, baseItemType: row.getEnumMember("baseItem", HEAD_GEAR_BY_NAME) };
    case EquipmentType.OneHandedMeleeWeapon:
      return {
        equipmentType,
        baseItemType: row.getEnumMember("baseItem", ONE_HANDED_MELEE_BY_NAME),
      };
    case EquipmentType.TwoHandedMeleeWeapon:
      return {
        equipmentType,
        baseItemType: row.getEnumMember("baseItem", TWO_HANDED_MELEE_BY_NAME),
      };
    case EquipmentType.TwoHandedRangedWeapon:
      return {
        equipmentType,
        baseItemType: row.getEnumMember("baseItem", TWO_HANDED_RANGED_BY_NAME),
      };
    case EquipmentType.Shield:
      return { equipmentType, baseItemType: row.getEnumMember("baseItem", SHIELDS_BY_NAME) };
    case EquipmentType.Ring:
      return { equipmentType, baseItemType: row.getEnumMember("baseItem", RINGS_BY_NAME) };
    case EquipmentType.Amulet:
      return { equipmentType, baseItemType: row.getEnumMember("baseItem", AMULETS_BY_NAME) };
  }
}

/** category[:kinetic[:element]], pipe separated, with "none" where an elemental source has no
 * kinetic type. mirrors the serializer in balance-tools */
function parseDamageClassifications(text: string, describeRow: string): ResourceChangeSource[] {
  return text.split("|").map((entry) => {
    const segments = entry.split(":");
    const [categoryName, kineticName, elementName] = segments;

    invariant(
      segments.length >= 1 && segments.length <= 3 && categoryName !== undefined,
      `${describeRow}: "${entry}" is not a damage classification`
    );

    const category = SOURCE_CATEGORIES_BY_NAME.get(categoryName);
    invariant(category !== undefined, `${describeRow}: "${categoryName}" is not a damage category`);

    const config: {
      category: ResourceChangeSourceCategory;
      kineticDamageTypeOption?: null | KineticDamageType;
      elementOption?: null | MagicalElement;
    } = { category };

    if (kineticName !== undefined && kineticName !== ABSENT_SEGMENT) {
      const kineticType = KINETIC_TYPES_BY_NAME.get(kineticName);
      invariant(kineticType !== undefined, `${describeRow}: "${kineticName}" is not a kinetic type`);
      config.kineticDamageTypeOption = kineticType;
    }

    if (elementName !== undefined) {
      const element = ELEMENTS_BY_NAME.get(elementName);
      invariant(element !== undefined, `${describeRow}: "${elementName}" is not an element`);
      config.elementOption = element;
    }

    return new ResourceChangeSource(config);
  });
}

const REQUIREMENT_COLUMNS: Partial<Record<CombatAttribute, string>> = {
  [CombatAttribute.Strength]: "reqStr",
  [CombatAttribute.Dexterity]: "reqDex",
  [CombatAttribute.Spirit]: "reqSpr",
  [CombatAttribute.Vitality]: "reqVit",
  [CombatAttribute.Agility]: "reqAgi",
};

function parseRequirements(row: CsvRow) {
  const requirements: Partial<Record<CombatAttribute, number>> = {};
  for (const attribute of ATTRIBUTE_POINT_ASSIGNABLE_ATTRIBUTES) {
    const column = REQUIREMENT_COLUMNS[attribute];
    invariant(column !== undefined, `no requirement column for ${CombatAttribute[attribute]}`);
    const value = row.getNumberOption(column);
    if (value !== null) {
      requirements[attribute] = value;
    }
  }
  return requirements;
}

const SHARED_COLUMNS = ["baseItem", "affixProfile", "minLvl", "maxLvl", "maxDura"];
const REQUIREMENT_COLUMN_NAMES = ATTRIBUTE_POINT_ASSIGNABLE_ATTRIBUTES.map((attribute) => {
  const column = REQUIREMENT_COLUMNS[attribute];
  invariant(column !== undefined, `no requirement column for ${CombatAttribute[attribute]}`);
  return column;
});

interface EquipmentSheet {
  tableName: string;
  impliedType: null | EquipmentType;
  specificColumns: string[];
  parseSpecific: (row: CsvRow, describeRow: string) => Partial<EquipmentTemplateSpec>;
}

const EQUIPMENT_SHEETS: EquipmentSheet[] = [
  {
    tableName: "equipment-weapons",
    impliedType: null,
    specificColumns: ["minDmg", "maxDmg", "damageClassificationsCount", "damageClassifications"],
    parseSpecific: (row, describeRow) => ({
      damage: new NumberRange(row.getNumber("minDmg"), row.getNumber("maxDmg")),
      damageClassificationsCount: row.getNumberOption("damageClassificationsCount"),
      damageClassifications: parseDamageClassifications(
        row.getText("damageClassifications"),
        describeRow
      ),
    }),
  },
  {
    tableName: "equipment-armor",
    impliedType: null,
    specificColumns: ["minAc", "maxAc", "armorCategory"],
    parseSpecific: (row) => ({
      armorClass: new NumberRange(row.getNumber("minAc"), row.getNumber("maxAc")),
      armorCategory: row.getEnumMember("armorCategory", ARMOR_CATEGORIES_BY_NAME),
    }),
  },
  {
    tableName: "equipment-shields",
    impliedType: EquipmentType.Shield,
    specificColumns: ["minAc", "maxAc", "shieldSize"],
    parseSpecific: (row) => ({
      armorClass: new NumberRange(row.getNumber("minAc"), row.getNumber("maxAc")),
      shieldSize: row.getEnumMember("shieldSize", SHIELD_SIZES_BY_NAME),
    }),
  },
  {
    tableName: "equipment-jewelry",
    impliedType: null,
    specificColumns: [],
    parseSpecific: () => ({}),
  },
];

export function parseEquipmentTemplateSpecs(): EquipmentTemplateSpec[] {
  const affixProfiles = new AffixProfileResolver();
  const specs: EquipmentTemplateSpec[] = [];

  for (const sheet of EQUIPMENT_SHEETS) {
    const columns = [
      ...SHARED_COLUMNS,
      ...(sheet.impliedType === null ? ["equipmentType"] : []),
      ...sheet.specificColumns,
      ...REQUIREMENT_COLUMN_NAMES,
    ];

    for (const row of readCsvTable(sheet.tableName, columns)) {
      const baseItemName = row.getText("baseItem");
      const describeRow = `${sheet.tableName}.csv ${baseItemName}`;
      const equipmentType =
        sheet.impliedType ?? row.getEnumMember("equipmentType", EQUIPMENT_TYPES_BY_NAME);

      specs.push({
        baseItem: parseBaseItem(equipmentType, row),
        levelRange: new NumberRange(row.getNumber("minLvl"), row.getNumber("maxLvl")),
        maxDurability: row.getNumberOption("maxDura"),
        requirements: parseRequirements(row),
        possibleAffixes: affixProfiles.resolve(baseItemName, row.getText("affixProfile")),
        damage: null,
        damageClassificationsCount: null,
        damageClassifications: [],
        armorClass: null,
        armorCategory: null,
        shieldSize: null,
        ...sheet.parseSpecific(row, describeRow),
      });
    }
  }

  assertEveryBaseItemCovered(specs);
  return specs;
}

/** a base item enum member with no row would otherwise only surface when a player happened to be
 * awarded that item */
function assertEveryBaseItemCovered(specs: EquipmentTemplateSpec[]) {
  const seen = new Map<EquipmentType, Set<number>>();

  for (const spec of specs) {
    const { equipmentType, baseItemType } = spec.baseItem;
    const seenOfType = seen.get(equipmentType) ?? new Set<number>();
    invariant(
      !seenOfType.has(baseItemType),
      `${EquipmentType[equipmentType]} ${baseItemType} has more than one row`
    );
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
      `${EquipmentType[equipmentType]} has no game data row for: ${missing.join(", ")}`
    );
  }
}
