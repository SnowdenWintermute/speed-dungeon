import fs from "node:fs";
import path from "node:path";
import {
  AffixType,
  ArmorCategory,
  CombatAttribute,
  EquipmentType,
  KineticDamageType,
  MagicalElement,
  ResourceChangeSourceCategory,
  ShieldSize,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import type {
  EquipmentTemplateSpec,
  NumberRange,
  ResourceChangeSource,
} from "@speed-dungeon/common";
import { getBaseItemReference } from "./enum-lookups.ts";
import { PACKAGE_ROOT } from "./game-data-paths.ts";

export const GENERATED_MODULE_PATH = path.join(
  PACKAGE_ROOT,
  "..",
  "common",
  "src",
  "items",
  "item-creation",
  "equipment-templates",
  "game-data.generated.ts"
);

const IMPORTED_NAMES = [
  "AffixType",
  "Amulet",
  "ArmorCategory",
  "BodyArmor",
  "CombatAttribute",
  "EquipmentTemplateSpec",
  "EquipmentType",
  "HeadGear",
  "KineticDamageType",
  "MagicalElement",
  "NumberRange",
  "OneHandedMeleeWeapon",
  "ResourceChangeSource",
  "ResourceChangeSourceCategory",
  "Ring",
  "Shield",
  "ShieldSize",
  "TwoHandedMeleeWeapon",
  "TwoHandedRangedWeapon",
];

const FILE_HEADER = `// GENERATED FILE — do not edit by hand.
// Source: packages/balance-tools/game-data.xlsx
// Regenerate with: yarn workspace @speed-dungeon/balance-tools sync
import {
${IMPORTED_NAMES.map((name) => `  ${name},`).join("\n")}
} from "./game-data-dependencies.js";
`;

function emitNumberRange(range: NumberRange) {
  return `new NumberRange(${range.min}, ${range.max})`;
}

function emitOptionalRange(range: null | NumberRange) {
  return range === null ? "null" : emitNumberRange(range);
}

function emitRequirements(requirements: EquipmentTemplateSpec["requirements"]) {
  const entries = iterateNumericEnumKeyedRecord(requirements).map(
    ([attribute, value]) => `[CombatAttribute.${CombatAttribute[attribute]}]: ${value}`
  );
  return entries.length === 0 ? "{}" : `{ ${entries.join(", ")} }`;
}

function emitMaxTiers(maxTiers: Partial<Record<AffixType, number>>) {
  const entries = iterateNumericEnumKeyedRecord(maxTiers).map(
    ([affixType, maxTier]) => `[AffixType.${AffixType[affixType]}]: ${maxTier}`
  );
  return entries.length === 0 ? "{}" : `{ ${entries.join(", ")} }`;
}

function emitDamageClassifications(sources: ResourceChangeSource[]) {
  if (sources.length === 0) {
    return "[]";
  }
  const entries = sources.map((source) => {
    const fields = [`category: ResourceChangeSourceCategory.${ResourceChangeSourceCategory[source.category]}`];
    if (source.kineticDamageTypeOption !== undefined) {
      fields.push(
        `kineticDamageTypeOption: KineticDamageType.${KineticDamageType[source.kineticDamageTypeOption]}`
      );
    }
    if (source.elementOption !== undefined) {
      fields.push(`elementOption: MagicalElement.${MagicalElement[source.elementOption]}`);
    }
    return `      new ResourceChangeSource({ ${fields.join(", ")} })`;
  });
  return `[\n${entries.join(",\n")},\n    ]`;
}

function emitSpec(spec: EquipmentTemplateSpec) {
  return `  {
    baseItem: {
      equipmentType: EquipmentType.${EquipmentType[spec.baseItem.equipmentType]},
      baseItemType: ${getBaseItemReference(spec.baseItem)},
    },
    levelRange: ${emitNumberRange(spec.levelRange)},
    maxDurability: ${spec.maxDurability},
    requirements: ${emitRequirements(spec.requirements)},
    possibleAffixes: {
      prefix: ${emitMaxTiers(spec.possibleAffixes.prefix)},
      suffix: ${emitMaxTiers(spec.possibleAffixes.suffix)},
    },
    damage: ${emitOptionalRange(spec.damage)},
    damageClassificationsCount: ${spec.damageClassificationsCount},
    damageClassifications: ${emitDamageClassifications(spec.damageClassifications)},
    armorClass: ${emitOptionalRange(spec.armorClass)},
    armorCategory: ${
      spec.armorCategory === null ? "null" : `ArmorCategory.${ArmorCategory[spec.armorCategory]}`
    },
    shieldSize: ${
      spec.shieldSize === null ? "null" : `ShieldSize.${ShieldSize[spec.shieldSize]}`
    },
  }`;
}

export function emitGameDataModule(specs: EquipmentTemplateSpec[]) {
  const body = `
export const EQUIPMENT_TEMPLATE_SPECS: EquipmentTemplateSpec[] = [
${specs.map(emitSpec).join(",\n")},
];
`;
  fs.writeFileSync(GENERATED_MODULE_PATH, `${FILE_HEADER}${body}`);
  return GENERATED_MODULE_PATH;
}
