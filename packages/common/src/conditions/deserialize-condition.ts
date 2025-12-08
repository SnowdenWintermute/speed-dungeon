import { CombatantConditionFactory } from "../index.js";
import { CombatantConditionInit } from "./condition-config.js";
import { CombatantCondition } from "./index.js";

/**Putting this on the condition class created a circular dependency which is why it is separately declared here*/
export function deserializeCondition(conditionInit: CombatantConditionInit): CombatantCondition {
  const deserializedCondition = CombatantConditionFactory.create(conditionInit);
  return deserializedCondition;
}
