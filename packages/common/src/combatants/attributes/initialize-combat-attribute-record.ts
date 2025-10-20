import { CombatantAttributeRecord } from "../attribute-properties.js";
import { CombatAttribute } from "../index.js";

export function initializeCombatAttributeRecord() {
  const allAttributesAsZero: CombatantAttributeRecord = {};
  for (const value of Object.values(CombatAttribute)) {
    if (typeof value === "string") continue;
    allAttributesAsZero[value] = 0;
  }
  return allAttributesAsZero as Record<CombatAttribute, number>;
}
