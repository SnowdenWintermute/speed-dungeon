import { iterateNumericEnumKeyedRecord } from "../../utils/index.js";
import { CombatantAttributeRecord } from "../combatant-attribute-record.js";
import { CombatAttribute } from "./index.js";

export function addAttributesToAccumulator(
  toAdd: CombatantAttributeRecord,
  acc: Record<CombatAttribute, number>
) {
  for (const [attribute, value] of iterateNumericEnumKeyedRecord(toAdd)) {
    if (!acc[attribute]) {
      acc[attribute] = value;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      acc[attribute]! += value;
    }
  }
}
