import { CombatantCondition } from "./index.js";
import { COMBATANT_CONDITION_CONSTRUCTORS } from "./condition-constructors.js";

/**Putting this on the condition class created a circular dependency which is why it is separately declared here*/
export function deserializeCondition(condition: CombatantCondition) {
  const constructor = COMBATANT_CONDITION_CONSTRUCTORS[condition.name];
  const { id, appliedBy, appliedTo, level, stacksOption, ...rest } = condition;
  console.log("stacksOption obtained:", stacksOption?.current);
  const deserialized = new constructor(id, appliedBy, appliedTo, level, stacksOption);

  for (const [key, value] of Object.entries(rest)) {
    if ((deserialized as any)[key] === undefined) {
      (deserialized as any)[key] = value;
    }
  }

  console.log("deserializeCondition:", deserialized);
  console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(deserialized.tickPropertiesOption)));
  return deserialized;
}
