import { Battle } from "../../battle/index.js";
import { CombatAttribute } from "../../combatants/attributes/index.js";
import { Combatant, CombatantCondition, CombatantProperties } from "../../combatants/index.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { EntityId } from "../../primatives/index.js";
import { BASE_ACTION_DELAY_MULTIPLIER } from "./consts.js";
import { CombatantTurnTracker, ConditionTurnTracker, TurnOrderManager } from "./index.js";

export class TurnOrderScheduler {
  turnSchedulerTrackers: (CombatantTurnSchedulerTracker | TickableConditionTurnSchedulerTracker)[] =
    [];

  constructor(
    public readonly minTrackersCount: number,
    game: SpeedDungeonGame,
    battle: Battle
  ) {
    const { combatants, tickableConditions } = Battle.getAllTickableConditionsAndCombatants(
      game,
      battle
    );

    this.turnSchedulerTrackers = [
      ...combatants.map((combatant) => new CombatantTurnSchedulerTracker(combatant)),
      ...tickableConditions.map(
        ({ combatantId, condition }) =>
          new TickableConditionTurnSchedulerTracker(combatantId, condition)
      ),
    ];
  }

  resetTurnSchedulerTrackers() {
    for (const tracker of this.turnSchedulerTrackers) {
      // take into account any delay they've accumulated from taking actions in this battle
      tracker.timeOfNextMove = tracker.accumulatedDelay;
      // start with an initial delay
      tracker.timeOfNextMove += TurnOrderManager.getActionDelayCost(
        tracker.speed,
        BASE_ACTION_DELAY_MULTIPLIER
      );
    }
  }

  sortSchedulerTrackers(key: keyof TurnSchedulerTracker) {
    this.turnSchedulerTrackers.sort((a, b) => a[key] - b[key]);
  }

  getFirstTracker() {
    const fastest = this.turnSchedulerTrackers[0];
    if (fastest === undefined) throw new Error("turn scheduler list was empty");
    return fastest;
  }

  buildNewList() {
    console.log("resetTurnSchedulerTrackers");
    this.resetTurnSchedulerTrackers();

    const turnTrackerList: (CombatantTurnTracker | ConditionTurnTracker)[] = [];

    console.log("starting loop");
    while (turnTrackerList.length < this.minTrackersCount) {
      console.log("sorting");
      this.sortSchedulerTrackers("timeOfNextMove");
      console.log("getting fastest");
      const fastestActor = this.getFirstTracker();
      if (fastestActor instanceof CombatantTurnSchedulerTracker) {
        console.log("accessing combatant");
        const combatant = fastestActor.combatant;
        if (!CombatantProperties.isDead(combatant.combatantProperties)) {
          turnTrackerList.push(
            new CombatantTurnTracker(
              fastestActor.combatant.entityProperties.id,
              fastestActor.timeOfNextMove
            )
          );
        }
      } else if (fastestActor instanceof TickableConditionTurnSchedulerTracker) {
        console.log("adding tracker to list");
        turnTrackerList.push(
          new ConditionTurnTracker(
            fastestActor.combatantId,
            fastestActor.combatantId,
            fastestActor.timeOfNextMove
          )
        );
      }

      console.log("getting delay");
      const delay = TurnOrderManager.getActionDelayCost(
        fastestActor.speed,
        BASE_ACTION_DELAY_MULTIPLIER
      );

      console.log("adding delay");
      fastestActor.timeOfNextMove += delay;
    }

    console.log("returning list");
    return turnTrackerList;
  }
}

class TurnSchedulerTracker {
  timeOfNextMove: number = 0;
  accumulatedDelay: number = 0; // when they take their turn, add to this
  constructor(public readonly speed: number) {}
}

class CombatantTurnSchedulerTracker extends TurnSchedulerTracker {
  constructor(public readonly combatant: Combatant) {
    const combatantSpeed = CombatantProperties.getTotalAttributes(combatant.combatantProperties)[
      CombatAttribute.Speed
    ];
    super(combatantSpeed);
  }
}

class TickableConditionTurnSchedulerTracker extends TurnSchedulerTracker {
  constructor(
    public readonly combatantId: EntityId,
    public readonly condition: CombatantCondition
  ) {
    if (condition.tickProperties === undefined)
      throw new Error("expected condition to be tickable");
    const speed = condition.tickProperties.getTickSpeed();
    super(speed);
  }
}
