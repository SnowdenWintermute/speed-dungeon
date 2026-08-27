import { CombatantAttributeRecord } from "./combatant-attribute-record.js";
import { COMBAT_ATTRIBUTES, CombatAttribute } from "./index.js";

export function addAttributesToAccumulator(
  toAdd: CombatantAttributeRecord,
  acc: Record<CombatAttribute, number>
) {
  addMultipliedAttributesToAccumulator(toAdd, acc, 1);
}

export function addMultipliedAttributesToAccumulator(
  toAdd: CombatantAttributeRecord,
  acc: Record<CombatAttribute, number>,
  multiplier: number
) {
  for (const attribute of COMBAT_ATTRIBUTES) {
    const value = toAdd[attribute];
    if (value === undefined) {
      continue;
    }
    const multiplied = value * multiplier;
    const existing = acc[attribute];
    if (!existing) {
      acc[attribute] = multiplied;
    } else {
      acc[attribute] = existing + multiplied;
    }
  }
}

export function removeAttributesFromAccumulator(
  toRemove: CombatantAttributeRecord,
  acc: CombatantAttributeRecord
) {
  for (const attribute of COMBAT_ATTRIBUTES) {
    const value = toRemove[attribute];
    const existing = acc[attribute];
    if (value === undefined || existing === undefined) {
      continue;
    }
    const remaining = existing - value;
    if (remaining < 0) {
      delete acc[attribute];
    } else {
      acc[attribute] = remaining;
    }
  }
}
