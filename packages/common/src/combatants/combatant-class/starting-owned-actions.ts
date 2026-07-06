import cloneDeep from "lodash.clonedeep";
import { CombatActionName } from "../../combat/combat-actions/combat-action-names.js";
import { CombatantClass } from "./classes.js";

export function getPlayerCharacterStartingActions(combatantClass: CombatantClass) {
  const actionsForClass = cloneDeep(CHARACTER_STARTING_OWNED_ACTIONS[combatantClass]);
  for (const actionName of genericActions) {
    actionsForClass[actionName] = 1;
  }

  return actionsForClass;
}

const genericActions = [
  CombatActionName.Attack,
  CombatActionName.ReadSkillBook,
  CombatActionName.UseGreenAutoinjector,
  CombatActionName.UseBlueAutoinjector,
  CombatActionName.PassTurn,
];

const CHARACTER_STARTING_OWNED_ACTIONS: Record<
  CombatantClass,
  Partial<Record<CombatActionName, number>>
> = {
  [CombatantClass.Warrior]: {},
  [CombatantClass.Mage]: {},
  [CombatantClass.Rogue]: {},
};
