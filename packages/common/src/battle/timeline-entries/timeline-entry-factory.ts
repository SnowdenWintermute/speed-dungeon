import {
  ActionUserType,
  TaggedActionUserEntityId,
} from "../../action-user-context/tagged-action-user-id.js";
import { CombatantId, ConditionId, EntityId } from "../../aliases.js";
import { ACTION_ENTITY_TURN_DELAY_POLICY } from "../turn-delay-policies/action-entity-turn-delay-policy.js";
import { COMBATANT_TURN_DELAY_POLICY } from "../turn-delay-policies/combatant-turn-delay-policy.js";
import { COMBATANT_CONDITION_TURN_DELAY_POLICY } from "../turn-delay-policies/condition-turn-delay-policy.js";
import { ActionEntityBattleTimelineEntry } from "./action-entity-timeline-entry.js";
import { CombatantBattleTimelineEntry } from "./combatant-timeline-entry.js";
import { ConditionBattleTimelineEntry } from "./condition-timeline-entry.js";
import { BattleTimelineEntryTiming } from "./index.js";

export class BattleTimelineEntryFactory {
  static create(
    taggedActionUserId: TaggedActionUserEntityId,
    timelineEntryTimings: BattleTimelineEntryTiming[]
  ) {
    switch (taggedActionUserId.type) {
      case ActionUserType.Combatant:
        return this.createForCombatant(taggedActionUserId.combatantId, timelineEntryTimings);
      case ActionUserType.Condition:
        return this.createForCondition(
          taggedActionUserId.conditionId,
          taggedActionUserId.combatantId,
          timelineEntryTimings
        );
      case ActionUserType.ActionEntity:
        return this.createForActionEntity(taggedActionUserId.actionEntityId, timelineEntryTimings);
    }
  }

  private static createForCombatant(
    combatantId: CombatantId,
    timelineEntryTimings: BattleTimelineEntryTiming[]
  ) {
    return timelineEntryTimings.map((timing, timelineEntryIndex) => {
      return new CombatantBattleTimelineEntry(
        { type: ActionUserType.Combatant, combatantId },
        COMBATANT_TURN_DELAY_POLICY,
        timelineEntryIndex,
        timing
      );
    });
  }

  private static createForCondition(
    conditionId: ConditionId,
    appliedToId: CombatantId,
    timelineEntryTimings: BattleTimelineEntryTiming[]
  ) {
    return timelineEntryTimings.map((timing, timelineEntryIndex) => {
      return new ConditionBattleTimelineEntry(
        {
          type: ActionUserType.Condition,
          conditionId,
          combatantId: appliedToId,
        },
        COMBATANT_CONDITION_TURN_DELAY_POLICY,
        timelineEntryIndex,
        timing
      );
    });
  }

  private static createForActionEntity(
    actionEntityId: EntityId,
    timelineEntryTimings: BattleTimelineEntryTiming[]
  ) {
    return timelineEntryTimings.map((timing, timelineEntryIndex) => {
      return new ActionEntityBattleTimelineEntry(
        {
          type: ActionUserType.ActionEntity,
          actionEntityId,
        },
        ACTION_ENTITY_TURN_DELAY_POLICY,
        timelineEntryIndex,
        timing
      );
    });
  }
}
