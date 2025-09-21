import { EntityId } from "../../primatives/index.js";

export enum TurnTrackerEntityType {
  Combatant,
  Condition,
  ActionEntity,
}

export interface TaggedCombatantTurnTrackerCombatantId {
  type: TurnTrackerEntityType.Combatant;
  combatantId: EntityId;
}

export interface TaggedConditionTurnTrackerConditionAndCombatantId {
  type: TurnTrackerEntityType.Condition;
  combatantId: EntityId;
  conditionId: EntityId;
}

export interface TaggedActionEntityTurnTrackerActionEntityId {
  type: TurnTrackerEntityType.ActionEntity;
  actionEntityId: EntityId;
}

export type TaggedTurnTrackerTrackedEntityId =
  | TaggedCombatantTurnTrackerCombatantId
  | TaggedActionEntityTurnTrackerActionEntityId
  | TaggedConditionTurnTrackerConditionAndCombatantId;
