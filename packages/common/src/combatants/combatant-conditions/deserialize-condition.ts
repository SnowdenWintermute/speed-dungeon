import { CombatantCondition } from "./index.js";
import { COMBATANT_CONDITION_CONSTRUCTORS } from "./condition-constructors.js";

/**Putting this on the condition class created a circular dependency which is why it is separately declared here*/
export function deserializeCondition(condition: CombatantCondition) {
  const constructor = COMBATANT_CONDITION_CONSTRUCTORS[condition.name];
  const { id, appliedBy, appliedTo, level, stacksOption, ...rest } = condition;
  const deserialized = new constructor(id, appliedBy, appliedTo, level, stacksOption);

  for (const [key, value] of Object.entries(rest)) {
    if ((deserialized as any)[key] === undefined) {
      (deserialized as any)[key] = value;
    }
  }

  return deserialized;
}
