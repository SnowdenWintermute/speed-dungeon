import { plainToInstance } from "class-transformer";
import { CombatantCondition } from "./index.js";
import { COMBATANT_CONDITION_CONSTRUCTORS } from "./condition-constructors.js";

/**Putting this on the condition class created a circular dependency which is why it is separately declared here*/
export function deserializeCondition(condition: CombatantCondition) {
  const constructor = COMBATANT_CONDITION_CONSTRUCTORS[condition.name];
  return plainToInstance(constructor, condition);
}
