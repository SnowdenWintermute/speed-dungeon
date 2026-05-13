import { ActionUserType } from "../../action-user-context/action-user.js";
import { ActionEntityTurnScheduler } from "./action-entity-turn-scheduler.js";
import { CombatantTurnScheduler } from "./combatant-turn-scheduler.js";
import { ConditionTurnScheduler } from "./condition-turn-scheduler.js";
import { ITurnScheduler } from "./turn-schedulers.js";
import { TaggedTurnTrackerTrackedEntityId } from "./turn-tracker-tagged-tracked-entity-ids.js";

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class TurnSchedulerFactory {
  static create(from: TaggedTurnTrackerTrackedEntityId, startingDelay: number): ITurnScheduler {
    let scheduler: ITurnScheduler;
    switch (from.type) {
      case ActionUserType.Combatant:
        scheduler = new CombatantTurnScheduler(from.combatantId);
        break;
      case ActionUserType.Condition: {
        scheduler = new ConditionTurnScheduler(from.combatantId, from.conditionId);
        break;
      }
      case ActionUserType.ActionEntity: {
        scheduler = new ActionEntityTurnScheduler(from.actionEntityId);
        break;
      }
    }
    scheduler.accumulatedDelay = startingDelay;
    return scheduler;
  }
}
