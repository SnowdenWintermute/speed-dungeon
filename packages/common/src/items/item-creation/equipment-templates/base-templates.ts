import { DEEPEST_FLOOR } from "../../../app-consts.js";
import { ResourceChangeSource } from "../../../combat/hp-change-source-types.js";
import { CombatAttribute } from "../../../combatants/attributes/index.js";
import { NumberRange } from "../../../primatives/number-range.js";
import { PrefixType, SuffixType } from "../../equipment/affixes.js";
import { ArmorCategory } from "../../equipment/equipment-properties/armor-properties.js";
import { ShieldSize } from "../../equipment/equipment-properties/shield-properties.js";
import { EquipmentBaseItem } from "../../equipment/equipment-types/index.js";

/** jewelry uses this directly — a ring carries nothing the base doesn't */
export class EquipmentGenerationTemplate {
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

export class WeaponGenerationTemplate extends EquipmentGenerationTemplate {
  damageClassificationsCount: number = 1;
  constructor(
    public damage: NumberRange,
    public possibleDamageClassifications: ResourceChangeSource[],
    public equipmentBaseItem: EquipmentBaseItem
  ) {
    super(equipmentBaseItem);
  }
}

export class ArmorGenerationTemplate extends EquipmentGenerationTemplate {
  constructor(
    public acRange: NumberRange,
    public armorCategory: ArmorCategory,
    public equipmentBaseItem: EquipmentBaseItem
  ) {
    super(equipmentBaseItem);
  }
}

export class ShieldGenerationTemplate extends EquipmentGenerationTemplate {
  constructor(
    public acRange: NumberRange,
    public size: ShieldSize,
    public equipmentBaseItem: EquipmentBaseItem
  ) {
    super(equipmentBaseItem);
  }
}
