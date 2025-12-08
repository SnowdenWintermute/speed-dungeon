import { CombatantConditionFactory } from "../index.js";
import { CombatantCondition } from "./index.js";

/**Putting this on the condition class created a circular dependency which is why it is separately declared here*/
export function deserializeCondition(condition: CombatantCondition): CombatantCondition {
  const deserializedCondition = CombatantConditionFactory.create(
    CombatantCondition.getInit(condition)
  );
  return deserializedCondition;
}
