import { ActionUserType } from "../../action-user-context/tagged-action-user-id.js";
import { ActionEntityTurnScheduler } from "./turn-schedulers/action-entity-turn-scheduler.js";
import { CombatantTurnScheduler } from "./turn-schedulers/combatant-turn-scheduler.js";
import { ConditionTurnScheduler } from "./turn-schedulers/condition-turn-scheduler.js";
import { ITurnScheduler } from "./turn-schedulers/index.js";
import { TaggedTurnTrackerTrackedEntityId } from "./turn-tracker-tagged-tracked-entity-ids.js";

export interface TurnSchedulerCreationDelay {
  initialDelay: number;
  accumulatedDelay: number;
}

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class TurnSchedulerFactory {
  static create(
    from: TaggedTurnTrackerTrackedEntityId,
    index: number,
    delays: TurnSchedulerCreationDelay
  ): ITurnScheduler {
    const { initialDelay, accumulatedDelay } = delays;
    let scheduler: ITurnScheduler;
    switch (from.type) {
      case ActionUserType.Combatant:
        scheduler = new CombatantTurnScheduler(from.combatantId, index, initialDelay);
        break;
      case ActionUserType.Condition: {
        scheduler = new ConditionTurnScheduler(
          from.combatantId,
          from.conditionId,
          index,
          initialDelay
        );
        break;
      }
      case ActionUserType.ActionEntity: {
        scheduler = new ActionEntityTurnScheduler(from.actionEntityId, index, initialDelay);
        break;
      }
    }

    scheduler.accumulatedDelay = accumulatedDelay;
    return scheduler;
  }
}
