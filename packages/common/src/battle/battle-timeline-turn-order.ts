import {
  ActionUserType,
  TaggedActionUserEntityId,
} from "../action-user-context/tagged-action-user-id.js";
import { EntityId } from "../aliases.js";
import { BattleTimelineEntryIdentifier } from "./timeline-entries/index.js";

const ACTION_USER_TYPE_TURN_ORDER_TIE_BREAK_VALUES: Record<ActionUserType, number> = {
  [ActionUserType.Combatant]: 0,
  [ActionUserType.Condition]: 1,
  [ActionUserType.ActionEntity]: 2,
};

export interface ITurnOrderSortable {
  timeOfNextTurn: number;
  turnDelayRate: number;
  index: number;
  actionUserType: ActionUserType;
  actionUserId: EntityId;
}

export class BattleTimelineTurnOrder {
  static compare(a: ITurnOrderSortable, b: ITurnOrderSortable) {
    return (
      a.timeOfNextTurn - b.timeOfNextTurn ||
      ACTION_USER_TYPE_TURN_ORDER_TIE_BREAK_VALUES[a.actionUserType] -
        ACTION_USER_TYPE_TURN_ORDER_TIE_BREAK_VALUES[b.actionUserType] ||
      a.turnDelayRate - b.turnDelayRate ||
      a.actionUserId.localeCompare(b.actionUserId) ||
      a.index - b.index
    );
  }
}

export interface BattleTimelineForecastEntry {
  identifier: BattleTimelineEntryIdentifier;
  taggedActionUserId: TaggedActionUserEntityId;
  timeOfTurn: number;
}

export const BATTLE_TIMELINE_FORECAST_COMBATANT_TURN_COUNT = 12;
