import {
  CombatAttribute,
  DEEPEST_FLOOR,
  EquipmentBaseItem,
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
  constructor(public equipmentBaseItem: EquipmentBaseItem) {}
}

export abstract class WeaponGenerationTemplate extends EquipmentGenerationTemplate {
  numDamageClassifications: number = 1;
  constructor(
    public damage: NumberRange,
    public possibleDamageClassifications: HpChangeSource[],
    public equipmentBaseItem: EquipmentBaseItem
  ) {
    super(equipmentBaseItem);
  }
}