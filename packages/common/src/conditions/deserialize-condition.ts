import { plainToInstance } from "class-transformer";
import { ActionUserTargetingProperties, CombatantConditionFactory } from "../index.js";
import { CombatantCondition } from "./index.js";

/**Putting this on the condition class created a circular dependency which is why it is separately declared here*/
export function deserializeCondition(condition: CombatantCondition): CombatantCondition {
  const init = CombatantCondition.getInit(condition);
  const deserializedCondition = CombatantConditionFactory.create(init);

  const { ...rest } = condition;
  for (const [key, value] of Object.entries(rest)) {
    if ((deserializedCondition as any)[key] === undefined) {
      (deserializedCondition as any)[key] = value;
    }
  }

  if (deserializedCondition.targetingProperties) {
    deserializedCondition.targetingProperties = plainToInstance(
      ActionUserTargetingProperties,
      deserializedCondition.targetingProperties
    );
  }

  return deserializedCondition;
}
