import { AdventuringParty } from "../../adventuring-party/index.js";
import { Battle } from "../../battle/index.js";
import { CombatAttribute } from "../../combatants/attributes/index.js";
import { CombatantProperties } from "../../combatants/index.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { EntityId } from "../../primatives/index.js";
import { BASE_ACTION_DELAY_MULTIPLIER } from "./consts.js";
import { CombatantTurnTracker, ConditionTurnTracker, TurnOrderManager } from "./index.js";

export enum TurnTrackerSortableProperty {
  TimeOfNextMove,
  AccumulatedDelay,
}

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
      ...combatants.map(
        (combatant) => new CombatantTurnSchedulerTracker(combatant.entityProperties.id)
      ),
      ...tickableConditions.map(
        ({ combatantId, condition }) =>
          new TickableConditionTurnSchedulerTracker(combatantId, condition.id)
      ),
    ];
  }

  resetTurnSchedulerTrackers(party: AdventuringParty) {
    for (const tracker of this.turnSchedulerTrackers) {
      // take into account any delay they've accumulated from taking actions in this battle
      tracker.timeOfNextMove = tracker.accumulatedDelay;
      console.log(
        "setting tracker time of next move to accumulated delay:",
        tracker.timeOfNextMove
      );
      const initialDelay = TurnOrderManager.getActionDelayCost(
        tracker.getSpeed(party),
        BASE_ACTION_DELAY_MULTIPLIER
      );
      // start with an initial delay
      tracker.timeOfNextMove += initialDelay;
      console.log("added initial delay:", tracker.timeOfNextMove);
    }
  }

  sortSchedulerTrackers(sortBy: TurnTrackerSortableProperty) {
    switch (sortBy) {
      case TurnTrackerSortableProperty.TimeOfNextMove:
        this.turnSchedulerTrackers.sort((a, b) => {
          if (a.timeOfNextMove !== b.timeOfNextMove) {
            console.log(
              "sorting by timeOfNextMove",
              "a:",
              a.timeOfNextMove,
              "b:",
              b.timeOfNextMove,
              a.timeOfNextMove - b.timeOfNextMove
            );
            return a.timeOfNextMove - b.timeOfNextMove;
          } else return a.combatantId.localeCompare(b.combatantId);
        });
        break;
      case TurnTrackerSortableProperty.AccumulatedDelay:
        this.turnSchedulerTrackers.sort((a, b) => {
          if (a.accumulatedDelay !== b.accumulatedDelay)
            return a.accumulatedDelay - b.accumulatedDelay;
          else return a.combatantId.localeCompare(b.combatantId);
        });
        break;
    }
  }

  getFirstTracker() {
    const fastest = this.turnSchedulerTrackers[0];
    if (fastest === undefined) throw new Error("turn scheduler list was empty");
    return fastest;
  }

  buildNewList(party: AdventuringParty) {
    this.resetTurnSchedulerTrackers(party);
    console.log("reset scheduler trackers:", JSON.stringify(this.turnSchedulerTrackers, null, 2));

    const turnTrackerList: (CombatantTurnTracker | ConditionTurnTracker)[] = [];

    while (turnTrackerList.length < this.minTrackersCount) {
      console.log("before sort:", JSON.stringify(this.turnSchedulerTrackers, null, 2));
      this.sortSchedulerTrackers(TurnTrackerSortableProperty.TimeOfNextMove);
      console.log("after sort:", JSON.stringify(this.turnSchedulerTrackers, null, 2));
      const fastestActor = this.getFirstTracker();
      console.log("fastestActor", fastestActor.combatantId);
      if (fastestActor instanceof CombatantTurnSchedulerTracker) {
        const combatantResult = AdventuringParty.getCombatant(party, fastestActor.combatantId);
        if (combatantResult instanceof Error) throw combatantResult;
        if (!CombatantProperties.isDead(combatantResult.combatantProperties)) {
          turnTrackerList.push(
            new CombatantTurnTracker(fastestActor.combatantId, fastestActor.timeOfNextMove)
          );
        }
      } else if (fastestActor instanceof TickableConditionTurnSchedulerTracker) {
        turnTrackerList.push(
          new ConditionTurnTracker(
            fastestActor.combatantId,
            fastestActor.combatantId,
            fastestActor.timeOfNextMove
          )
        );
      }

      const delay = TurnOrderManager.getActionDelayCost(
        fastestActor.getSpeed(party),
        BASE_ACTION_DELAY_MULTIPLIER
      );

      fastestActor.timeOfNextMove += delay;
      console.log("added delay:", delay, "now has:", fastestActor.timeOfNextMove);
    }

    console.log("returning list", turnTrackerList);
    return turnTrackerList;
  }
}

interface ITurnSchedulerTracker {
  timeOfNextMove: number;
  accumulatedDelay: number; // when they take their turn, add to this
  getSpeed: (party: AdventuringParty) => number;
}

class CombatantTurnSchedulerTracker implements ITurnSchedulerTracker {
  timeOfNextMove: number = 0;
  accumulatedDelay: number = 0;
  constructor(public readonly combatantId: EntityId) {}
  getSpeed(party: AdventuringParty) {
    const combatantResult = AdventuringParty.getCombatant(party, this.combatantId);
    if (combatantResult instanceof Error) throw combatantResult;
    const combatantSpeed = CombatantProperties.getTotalAttributes(
      combatantResult.combatantProperties
    )[CombatAttribute.Speed];
    return combatantSpeed;
  }
}

class TickableConditionTurnSchedulerTracker implements ITurnSchedulerTracker {
  timeOfNextMove: number = 0;
  accumulatedDelay: number = 0;
  constructor(
    public readonly combatantId: EntityId,
    public readonly conditionId: EntityId
  ) {}
  getSpeed(party: AdventuringParty) {
    const conditionResult = AdventuringParty.getConditionOnCombatant(
      party,
      this.combatantId,
      this.conditionId
    );
    if (conditionResult instanceof Error) throw conditionResult;

    if (conditionResult.tickProperties === undefined)
      throw new Error("expected condition to be tickable");
    return conditionResult.tickProperties.getTickSpeed();
  }
}
