import { ActionEntityTurnScheduler } from "./action-entity-turn-scheduler.js";
import { CombatantTurnScheduler } from "./combatant-turn-scheduler.js";
import { ConditionTurnScheduler } from "./condition-turn-scheduler.js";
import { ITurnScheduler } from "./turn-schedulers.js";
import {
  TaggedTurnTrackerTrackedEntityId,
  TurnTrackerEntityType,
} from "./turn-tracker-tagged-tracked-entity-ids.js";

export class TurnSchedulerFactory {
  static create(from: TaggedTurnTrackerTrackedEntityId, startingDelay: number): ITurnScheduler {
    switch (from.type) {
      case TurnTrackerEntityType.Combatant:
        const scheduler = new CombatantTurnScheduler(from.combatantId);
        return scheduler;

      case TurnTrackerEntityType.Condition: {
        const scheduler = new ConditionTurnScheduler(from.combatantId, from.conditionId);
        scheduler.accumulatedDelay = startingDelay;
        return scheduler;
      }

      case TurnTrackerEntityType.ActionEntity: {
        const scheduler = new ActionEntityTurnScheduler(from.actionEntityId);
        scheduler.accumulatedDelay = startingDelay;
        return scheduler;
      }
    }
  }
}
