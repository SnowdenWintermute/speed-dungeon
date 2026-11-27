import {
  ActionUserType,
  TaggedActionUserEntityId,
} from "../../action-user-context/tagged-action-user-id.js";
import { CombatantId, ConditionId, EntityId } from "../../aliases.js";
import { SerializedOf } from "../../serialization/index.js";
import { ACTION_ENTITY_TURN_DELAY_POLICY } from "../turn-delay-policies/action-entity-turn-delay-policy.js";
import { COMBATANT_TURN_DELAY_POLICY } from "../turn-delay-policies/combatant-turn-delay-policy.js";
import { COMBATANT_CONDITION_TURN_DELAY_POLICY } from "../turn-delay-policies/condition-turn-delay-policy.js";
import { ActionEntityBattleTimelineEntry } from "./action-entity-timeline-entry.js";
import { AnyBattleTimelineEntry } from "./any-battle-timeline-entry.js";
import { CombatantBattleTimelineEntry } from "./combatant-timeline-entry.js";
import { ConditionBattleTimelineEntry } from "./condition-timeline-entry.js";
import { BattleTimelineEntryTiming } from "./index.js";

export class BattleTimelineEntryFactory {
  static createEntries(
    taggedActionUserId: TaggedActionUserEntityId,
    timelineEntryTimings: BattleTimelineEntryTiming[]
  ) {
    return timelineEntryTimings.map((timing, index) => {
      return this.createOne(taggedActionUserId, index, timing);
    });
  }

  static fromSerialized(serialized: SerializedOf<AnyBattleTimelineEntry>) {
    return BattleTimelineEntryFactory.createOne(
      serialized.taggedActionUserId,
      serialized.index,
      serialized.timing
    );
  }

  static createOne(
    taggedActionUserId: TaggedActionUserEntityId,
    index: number,
    timing: BattleTimelineEntryTiming
  ) {
    switch (taggedActionUserId.type) {
      case ActionUserType.Combatant:
        return this.createForCombatant(taggedActionUserId.combatantId, index, timing);
      case ActionUserType.Condition:
        return this.createForCondition(
          taggedActionUserId.conditionId,
          taggedActionUserId.combatantId,
          index,
          timing
        );
      case ActionUserType.ActionEntity:
        return this.createForActionEntity(taggedActionUserId.actionEntityId, index, timing);
    }
  }

  private static createForCombatant(
    combatantId: CombatantId,
    index: number,
    timing: BattleTimelineEntryTiming
  ) {
    return new CombatantBattleTimelineEntry(
      { type: ActionUserType.Combatant, combatantId },
      COMBATANT_TURN_DELAY_POLICY,
      index,
      timing
    );
  }

  private static createForCondition(
    conditionId: ConditionId,
    appliedToId: CombatantId,
    index: number,
    timing: BattleTimelineEntryTiming
  ) {
    return new ConditionBattleTimelineEntry(
      {
        type: ActionUserType.Condition,
        conditionId,
        combatantId: appliedToId,
      },
      COMBATANT_CONDITION_TURN_DELAY_POLICY,
      index,
      timing
    );
  }

  private static createForActionEntity(
    actionEntityId: EntityId,
    index: number,
    timing: BattleTimelineEntryTiming
  ) {
    return new ActionEntityBattleTimelineEntry(
      {
        type: ActionUserType.ActionEntity,
        actionEntityId,
      },
      ACTION_ENTITY_TURN_DELAY_POLICY,
      index,
      timing
    );
  }
}
