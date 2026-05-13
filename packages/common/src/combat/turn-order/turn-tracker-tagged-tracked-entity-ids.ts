import { ActionUserType } from "../../action-user-context/action-user.js";
import { CombatantId, EntityId } from "../../aliases.js";

export interface TaggedCombatantTurnTrackerCombatantId {
  type: ActionUserType.Combatant;
  combatantId: CombatantId;
}

export interface TaggedConditionTurnTrackerConditionAndCombatantId {
  type: ActionUserType.Condition;
  combatantId: EntityId;
  conditionId: EntityId;
}

export interface TaggedActionEntityTurnTrackerActionEntityId {
  type: ActionUserType.ActionEntity;
  actionEntityId: EntityId;
}

export type TaggedTurnTrackerTrackedEntityId =
  | TaggedCombatantTurnTrackerCombatantId
  | TaggedActionEntityTurnTrackerActionEntityId
  | TaggedConditionTurnTrackerConditionAndCombatantId;
