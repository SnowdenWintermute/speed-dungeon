// users can either be a combatant (properties) or a triggered condition
// with a "level" and "stacks" properties

import { CombatantCondition, CombatantProperties } from "../../combatants";

export enum ActionUserType {
  Combatant,
  Condition,
}

export type ActionUserCombatant = {
  type: ActionUserType.Combatant;
  combatantProperties: CombatantProperties;
};

export type ActionUserCondition = {
  type: ActionUserType.Condition;
  condition: CombatantCondition;
};

export type CombatActionUser = ActionUserCondition | ActionUserCombatant;
