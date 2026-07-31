import {
  Amulet,
  ArmorCategory,
  BODY_ARMOR_EQUIPMENT_GENERATION_TEMPLATES,
  BodyArmor,
  EquipmentType,
  HEAD_GEAR_EQUIPMENT_GENERATION_TEMPLATES,
  HeadGear,
  KineticDamageType,
  MagicalElement,
  ONE_HANDED_MELEE_EQUIPMENT_GENERATION_TEMPLATES,
  OneHandedMeleeWeapon,
  ResourceChangeSourceCategory,
  Ring,
  SHIELD_EQUIPMENT_GENERATION_TEMPLATES,
  Shield,
  ShieldSize,
  TWO_HANDED_MELEE_EQUIPMENT_GENERATION_TEMPLATES,
  TWO_HANDED_RANGED_EQUIPMENT_GENERATION_TEMPLATES,
  TwoHandedMeleeWeapon,
  TwoHandedRangedWeapon,
  getEquipmentGenerationTemplate,
  iterateNumericEnum,
} from "@speed-dungeon/common";
import type {
  AffixType,
  CombatAttribute,
  NumberRange,
  ResourceChangeSource,
} from "@speed-dungeon/common";

export interface EquipmentTemplateRow {
  baseItem: string;
  equipmentType: EquipmentType;
  affixProfile: string;
  levelRange: NumberRange;
  maxDurability: null | number;
  requirements: Partial<Record<CombatAttribute, number>>;
  possibleAffixes: {
    prefix: Partial<Record<AffixType, number>>;
    suffix: Partial<Record<AffixType, number>>;
  };
  damage: null | NumberRange;
  numDamageClassifications: null | number;
  damageClassifications: null | ResourceChangeSource[];
  armorClass: null | NumberRange;
  armorCategory: null | ArmorCategory;
  shieldSize: null | ShieldSize;
}

/** the three staves that roll caster affixes instead of the physical two-handed set. deliberately
 * not common's STAVES, which is a wider visual grouping including the Bo Staff and Rotting Branch —
 * those roll the ordinary physical affixes */
const CASTER_STAVES = [
  TwoHandedMeleeWeapon.ElmStaff,
  TwoHandedMeleeWeapon.MahoganyStaff,
  TwoHandedMeleeWeapon.EbonyStaff,
];

const EMPTY_TEMPLATE_FIELDS = {
  damage: null,
  numDamageClassifications: null,
  damageClassifications: null,
  armorClass: null,
  armorCategory: null,
  shieldSize: null,
};

export function collectEquipmentTemplateRows(): EquipmentTemplateRow[] {
  return [
    ...collectOneHandedMeleeWeapons(),
    ...collectTwoHandedMeleeWeapons(),
    ...collectTwoHandedRangedWeapons(),
    ...collectBodyArmor(),
    ...collectHeadGear(),
    ...collectShields(),
    ...collectJewelry(),
  ];
}

function collectOneHandedMeleeWeapons(): EquipmentTemplateRow[] {
  return iterateNumericEnum(OneHandedMeleeWeapon).map((baseItemType) => {
    const template = ONE_HANDED_MELEE_EQUIPMENT_GENERATION_TEMPLATES[baseItemType];
    return {
      ...EMPTY_TEMPLATE_FIELDS,
      baseItem: OneHandedMeleeWeapon[baseItemType],
      equipmentType: EquipmentType.OneHandedMeleeWeapon,
      affixProfile: "OneHandedMelee",
      levelRange: template.levelRange,
      maxDurability: template.maxDurability,
      requirements: template.requirements,
      possibleAffixes: template.possibleAffixes,
      damage: template.damage,
      numDamageClassifications: template.numDamageClassifications,
      damageClassifications: template.possibleDamageClassifications,
    };
  });
}

function collectTwoHandedMeleeWeapons(): EquipmentTemplateRow[] {
  return iterateNumericEnum(TwoHandedMeleeWeapon).map((baseItemType) => {
    const template = TWO_HANDED_MELEE_EQUIPMENT_GENERATION_TEMPLATES[baseItemType];
    return {
      ...EMPTY_TEMPLATE_FIELDS,
      baseItem: TwoHandedMeleeWeapon[baseItemType],
      equipmentType: EquipmentType.TwoHandedMeleeWeapon,
      affixProfile: CASTER_STAVES.includes(baseItemType)
        ? "TwoHandedMeleeCaster"
        : "TwoHandedMelee",
      levelRange: template.levelRange,
      maxDurability: template.maxDurability,
      requirements: template.requirements,
      possibleAffixes: template.possibleAffixes,
      damage: template.damage,
      numDamageClassifications: template.numDamageClassifications,
      damageClassifications: template.possibleDamageClassifications,
    };
  });
}

function collectTwoHandedRangedWeapons(): EquipmentTemplateRow[] {
  return iterateNumericEnum(TwoHandedRangedWeapon).map((baseItemType) => {
    const template = TWO_HANDED_RANGED_EQUIPMENT_GENERATION_TEMPLATES[baseItemType];
    return {
      ...EMPTY_TEMPLATE_FIELDS,
      baseItem: TwoHandedRangedWeapon[baseItemType],
      equipmentType: EquipmentType.TwoHandedRangedWeapon,
      affixProfile: "TwoHandedRanged",
      levelRange: template.levelRange,
      maxDurability: template.maxDurability,
      requirements: template.requirements,
      possibleAffixes: template.possibleAffixes,
      damage: template.damage,
      numDamageClassifications: template.numDamageClassifications,
      damageClassifications: template.possibleDamageClassifications,
    };
  });
}

function collectBodyArmor(): EquipmentTemplateRow[] {
  return iterateNumericEnum(BodyArmor).map((baseItemType) => {
    const template = BODY_ARMOR_EQUIPMENT_GENERATION_TEMPLATES[baseItemType];
    return {
      ...EMPTY_TEMPLATE_FIELDS,
      baseItem: BodyArmor[baseItemType],
      equipmentType: EquipmentType.BodyArmor,
      affixProfile: `BodyArmor${ArmorCategory[template.armorCategory]}`,
      levelRange: template.levelRange,
      maxDurability: template.maxDurability,
      requirements: template.requirements,
      possibleAffixes: template.possibleAffixes,
      armorClass: template.acRange,
      armorCategory: template.armorCategory,
    };
  });
}

function collectHeadGear(): EquipmentTemplateRow[] {
  return iterateNumericEnum(HeadGear).map((baseItemType) => {
    const template = HEAD_GEAR_EQUIPMENT_GENERATION_TEMPLATES[baseItemType];
    return {
      ...EMPTY_TEMPLATE_FIELDS,
      baseItem: HeadGear[baseItemType],
      equipmentType: EquipmentType.HeadGear,
      affixProfile: `HeadGear${ArmorCategory[template.armorCategory]}`,
      levelRange: template.levelRange,
      maxDurability: template.maxDurability,
      requirements: template.requirements,
      possibleAffixes: template.possibleAffixes,
      armorClass: template.acRange,
      armorCategory: template.armorCategory,
    };
  });
}

function collectShields(): EquipmentTemplateRow[] {
  return iterateNumericEnum(Shield).map((baseItemType) => {
    const template = SHIELD_EQUIPMENT_GENERATION_TEMPLATES[baseItemType];
    return {
      ...EMPTY_TEMPLATE_FIELDS,
      baseItem: Shield[baseItemType],
      equipmentType: EquipmentType.Shield,
      affixProfile: "Shield",
      levelRange: template.levelRange,
      maxDurability: template.maxDurability,
      requirements: template.requirements,
      possibleAffixes: template.possibleAffixes,
      armorClass: template.acRange,
      shieldSize: template.size,
    };
  });
}

function collectJewelry(): EquipmentTemplateRow[] {
  const ringTemplate = getEquipmentGenerationTemplate({
    equipmentType: EquipmentType.Ring,
    baseItemType: Ring.Ring,
  });
  const amuletTemplate = getEquipmentGenerationTemplate({
    equipmentType: EquipmentType.Amulet,
    baseItemType: Amulet.Amulet,
  });

  return [
    { baseItem: Ring[Ring.Ring], equipmentType: EquipmentType.Ring, template: ringTemplate },
    {
      baseItem: Amulet[Amulet.Amulet],
      equipmentType: EquipmentType.Amulet,
      template: amuletTemplate,
    },
  ].map(({ baseItem, equipmentType, template }) => ({
    ...EMPTY_TEMPLATE_FIELDS,
    baseItem,
    equipmentType,
    affixProfile: "Jewelry",
    levelRange: template.levelRange,
    maxDurability: template.maxDurability,
    requirements: template.requirements,
    possibleAffixes: template.possibleAffixes,
  }));
}

const ABSENT_SEGMENT = "-";

export function serializeDamageClassifications(sources: ResourceChangeSource[]) {
  return sources.map(serializeDamageClassification).join("|");
}

/** category[:kinetic[:element]], with "-" standing in for a kinetic type an elemental source
 * doesn't have */
function serializeDamageClassification(source: ResourceChangeSource) {
  const { kineticDamageTypeOption, elementOption } = source;
  const segments = [ResourceChangeSourceCategory[source.category]];

  if (elementOption !== undefined) {
    segments.push(
      kineticDamageTypeOption === undefined
        ? ABSENT_SEGMENT
        : KineticDamageType[kineticDamageTypeOption]
    );
    segments.push(MagicalElement[elementOption]);
  } else if (kineticDamageTypeOption !== undefined) {
    segments.push(KineticDamageType[kineticDamageTypeOption]);
  }

  return segments.join(":");
}
