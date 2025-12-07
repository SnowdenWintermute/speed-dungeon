import { CombatantConditionFactory } from "../index.js";
import { CombatantCondition } from "./index.js";
import { CombatantConditionInit } from "./condition-config.js";

/**Putting this on the condition class created a circular dependency which is why it is separately declared here*/
export function deserializeCondition(init: CombatantConditionInit): CombatantCondition {
  const deserializedCondition = CombatantConditionFactory.create(init);

  return deserializedCondition;
}
