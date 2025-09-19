import { CombatantProperties } from "../../../../combatants/index.js";
import {
  Consumable,
  SKILL_BOOK_TYPE_TO_COMBATANT_CLASS,
} from "../../../../items/consumables/index.js";

export function onSkillBookRead(user: CombatantProperties, book: Consumable) {
  const skillBookClass = SKILL_BOOK_TYPE_TO_COMBATANT_CLASS[book.consumableType];
  if (skillBookClass === undefined)
    return new Error("Somehow tried to read a skill book that wasn't associated with any class");

  CombatantProperties.changeSupportClassLevel(user, skillBookClass, 1);
  return { supportClassLevelIncreased: skillBookClass };
}
