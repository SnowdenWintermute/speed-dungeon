import { CombatantConditionFactory, SerializedOf } from "../index.js";
import { CombatantCondition } from "./index.js";

/**Putting this on the condition class created a circular dependency which is why it is separately declared here*/
export function deserializeCondition(
  serialized: SerializedOf<CombatantCondition>
): CombatantCondition {
  return CombatantConditionFactory.create(serialized);
}
