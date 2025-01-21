import { CombatantAttributeRecord } from "../index.js";
import { iterateNumericEnumKeyedRecord } from "../../utils/index.js";

export function addAttributesToAccumulator(
  toAdd: CombatantAttributeRecord,
  acc: CombatantAttributeRecord
) {
  for (const [attribute, value] of iterateNumericEnumKeyedRecord(toAdd)) {
    if (!acc[attribute]) acc[attribute] = value;
    else acc[attribute]! += value || 0; // use ! because ts complains it may be undefined even though checked above
  }
}
