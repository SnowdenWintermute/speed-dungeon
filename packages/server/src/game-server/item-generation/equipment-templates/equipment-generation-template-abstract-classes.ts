import {
  CombatAttribute,
  DEEPEST_FLOOR,
  HpChangeSource,
  NumberRange,
  PrefixType,
  SuffixType,
} from "@speed-dungeon/common";

export abstract class EquipmentGenerationTemplate {
  levelRange: NumberRange = new NumberRange(1, DEEPEST_FLOOR);
  durability: null | NumberRange = null;
  requirements: Partial<Record<CombatAttribute, number>> = {};
  possibleAffixes: {
    prefix: Partial<Record<PrefixType, number>>;
    suffix: Partial<Record<SuffixType, number>>;
  } = {
    prefix: {},
    suffix: {},
  };
}

export abstract class WeaponGenerationTemplate extends EquipmentGenerationTemplate {
  numDamageClassifications: number = 1;
  constructor(
    public damage: NumberRange,
    public possibleDamageClassifications: HpChangeSource[]
  ) {
    super();
  }
}
