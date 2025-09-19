import { CombatantAttributeRecord } from "../index.js";
import { iterateNumericEnumKeyedRecord } from "../../utils/index.js";
import { CombatAttribute } from "./index.js";

export function addAttributesToAccumulator(
  toAdd: CombatantAttributeRecord,
  acc: Record<CombatAttribute, number>
) {
  for (const [attribute, value] of iterateNumericEnumKeyedRecord(toAdd)) {
    if (!acc[attribute]) acc[attribute] = value;
    else acc[attribute]! += value;
  }
}
