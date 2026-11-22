import { ActionUserType } from "../../action-user-context/action-user.js";
import { ActionEntityTurnScheduler } from "./turn-schedulers/action-entity-turn-scheduler.js";
import { CombatantTurnScheduler } from "./turn-schedulers/combatant-turn-scheduler.js";
import { ConditionTurnScheduler } from "./turn-schedulers/condition-turn-scheduler.js";
import { ITurnScheduler } from "./turn-schedulers/index.js";
import { TaggedTurnTrackerTrackedEntityId } from "./turn-tracker-tagged-tracked-entity-ids.js";

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class TurnSchedulerFactory {
  static create(
    from: TaggedTurnTrackerTrackedEntityId,
    startingDelay: number,
    index: number
  ): ITurnScheduler {
    let scheduler: ITurnScheduler;
    switch (from.type) {
      case ActionUserType.Combatant:
        scheduler = new CombatantTurnScheduler(from.combatantId, index);
        break;
      case ActionUserType.Condition: {
        scheduler = new ConditionTurnScheduler(from.combatantId, from.conditionId, index);
        break;
      }
      case ActionUserType.ActionEntity: {
        scheduler = new ActionEntityTurnScheduler(from.actionEntityId, index);
        break;
      }
    }
    scheduler.accumulatedDelay = startingDelay;
    return scheduler;
  }
}
