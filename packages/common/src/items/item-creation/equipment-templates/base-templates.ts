import { DEEPEST_FLOOR } from "../../../app-consts.js";
import { ResourceChangeSource } from "../../../combat/hp-change-source-types.js";
import { CombatAttribute } from "../../../combatants/index.js";
import { NumberRange } from "../../../primatives/index.js";
import { PrefixType, SuffixType } from "../../equipment/affixes.js";
import { ArmorCategory } from "../../equipment/equipment-properties/armor-properties.js";
import { EquipmentBaseItem } from "../../equipment/equipment-types/index.js";

export abstract class EquipmentGenerationTemplate {
  levelRange: NumberRange = new NumberRange(1, DEEPEST_FLOOR);
  maxDurability: null | number = null;
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
    public possibleDamageClassifications: ResourceChangeSource[],
    public equipmentBaseItem: EquipmentBaseItem
  ) {
    super(equipmentBaseItem);
  }
}

export abstract class ArmorGenerationTemplate extends EquipmentGenerationTemplate {
  numDamageClassifications: number = 1;
  constructor(
    public acRange: NumberRange,
    public armorCategory: ArmorCategory,
    public equipmentBaseItem: EquipmentBaseItem
  ) {
    super(equipmentBaseItem);
  }
}
