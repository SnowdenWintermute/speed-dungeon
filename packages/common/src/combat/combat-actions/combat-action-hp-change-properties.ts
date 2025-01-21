import { CombatAttribute } from "../../combatants/attributes/index.js";
import { HoldableSlotType } from "../../items/equipment/slots.js";
import { NumberRange } from "../../primatives/index.js";
import { HpChangeSource, HpChangeSourceModifiers } from "../hp-change-source-types.js";

export class CombatActionHpChangeProperties {
  baseValues: NumberRange = new NumberRange(0, 0);
  finalDamagePercentMultiplier: number = 100;
  addWeaponDamageFromSlots: null | HoldableSlotType[] = null;
  addWeaponModifiersFromSlot: null | {
    slot: HoldableSlotType;
    modifiers: Set<HpChangeSourceModifiers>;
  } = null;
  additiveAttributeAndPercentScalingFactor: null | [CombatAttribute, number] = null;
  critChanceAttribute: null | CombatAttribute = null;
  critChanceModifier: null | number = null;
  critMultiplierAttribute: null | CombatAttribute = null;
  constructor(public hpChangeSource: HpChangeSource) {}
}
