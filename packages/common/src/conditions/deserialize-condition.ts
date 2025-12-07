import { CombatantCondition } from "./index.js";
/**Putting this on the condition class created a circular dependency which is why it is separately declared here*/
/** this note was befor the refactor though */
export function deserializeCondition(condition: CombatantCondition): CombatantCondition {
  throw new Error("needs reimplemented");
  // const constructor = COMBATANT_CONDITION_CONSTRUCTORS[condition.name];
  // const { id, appliedBy, appliedTo, level, stacksOption, ...rest } = condition;
  // const deserialized = new constructor(id, appliedBy, appliedTo, level, stacksOption);

  // for (const [key, value] of Object.entries(rest)) {
  //   if ((deserialized as any)[key] === undefined) {
  //     (deserialized as any)[key] = value;
  //   }
  // }

  // return deserialized;
}
