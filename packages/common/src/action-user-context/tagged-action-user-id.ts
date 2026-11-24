import { CombatantId, ConditionId, EntityId } from "../aliases.js";

export enum ActionUserType {
  Combatant,
  Condition,
  ActionEntity,
}

export interface TaggedCombatantActionUserCombatantId {
  type: ActionUserType.Combatant;
  combatantId: CombatantId;
}

export interface TaggedConditionActionUserConditionAndCombatantId {
  type: ActionUserType.Condition;
  combatantId: CombatantId;
  conditionId: ConditionId;
}

export interface TaggedActionEntityActionUserEntityId {
  type: ActionUserType.ActionEntity;
  actionEntityId: EntityId;
}

export type TaggedActionUserEntityId =
  | TaggedCombatantActionUserCombatantId
  | TaggedActionEntityActionUserEntityId
  | TaggedConditionActionUserConditionAndCombatantId;
