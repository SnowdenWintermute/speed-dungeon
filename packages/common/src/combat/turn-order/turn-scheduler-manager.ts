import { AdventuringParty } from "../../adventuring-party/index.js";
import { Battle } from "../../battle/index.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { EntityId } from "../../primatives/index.js";
import { ActionEntityTurnScheduler } from "./action-entity-turn-scheduler.js";
import { CombatantTurnScheduler } from "./combatant-turn-scheduler.js";
import { ConditionTurnScheduler } from "./condition-turn-scheduler.js";
import { BASE_ACTION_DELAY_MULTIPLIER } from "./consts.js";
import {
  CombatantTurnTracker,
  TaggedTurnTrackerTrackedEntityId,
  TurnOrderManager,
  TurnTracker,
  TurnTrackerEntityType,
} from "./index.js";
import { ITurnScheduler } from "./turn-schedulers.js";

export enum TurnTrackerSortableProperty {
  TimeOfNextMove,
  AccumulatedDelay,
}

export class TurnSchedulerManager {
  schedulers: ITurnScheduler[] = [];

  constructor(
    public readonly minTurnTrackersCount: number,
    game: SpeedDungeonGame,
    battle: Battle
  ) {
    const { combatants, tickableConditions } = Battle.getAllTickableConditionsAndCombatants(
      game,
      battle
    );

    this.schedulers = [
      ...combatants.map((combatant) => new CombatantTurnScheduler(combatant.entityProperties.id)),
      ...tickableConditions.map(
        ({ appliedTo, condition }) => new ConditionTurnScheduler(appliedTo, condition.id)
      ),
    ];
  }

  getSchedulerByCombatantId(entityId: EntityId) {
    const filtered = this.schedulers.filter(
      (scheduler) => scheduler instanceof CombatantTurnScheduler
    );
    const found = filtered.find((scheduler) => scheduler.combatantId === entityId);
    if (found === undefined) throw new Error("Expected combatant turn order scheduler not found");
    return found;
  }

  getMatchingSchedulerFromTurnOrderTracker(turnOrderTracker: TurnTracker) {
    const schedulerOption = turnOrderTracker.getMatchingScheduler(this.schedulers);
    if (schedulerOption === undefined) throw new Error("expected turnSchedulerTracker was missing");
    return schedulerOption;
  }

  private removeStaleTurnSchedulers(party: AdventuringParty) {
    const toRemove: ITurnScheduler[] = [];

    for (const scheduler of this.schedulers) {
      if (scheduler.isStale(party)) toRemove.push(scheduler);
    }

    // @PERF - probably a faster way to do this
    this.schedulers = this.schedulers.filter((scheduler) => {
      for (const schedulerToRemove of toRemove) {
        if (scheduler.isMatch(schedulerToRemove)) return false;
      }
      return true;
    });
  }

  private sortSchedulers(sortBy: TurnTrackerSortableProperty, party: AdventuringParty) {
    switch (sortBy) {
      case TurnTrackerSortableProperty.TimeOfNextMove:
        this.schedulers.sort((a, b) => {
          if (a.timeOfNextMove !== b.timeOfNextMove) {
            return a.timeOfNextMove - b.timeOfNextMove;
          } else if (a.getSpeed(party) !== b.getSpeed(party)) {
            return b.getSpeed(party) - a.getSpeed(party);
          } else return a.getTiebreakerId().localeCompare(b.getTiebreakerId());
        });
        break;
      case TurnTrackerSortableProperty.AccumulatedDelay:
        this.schedulers.sort((a, b) => {
          if (a.accumulatedDelay !== b.accumulatedDelay)
            return a.accumulatedDelay - b.accumulatedDelay;
          else if (a.getSpeed(party) !== b.getSpeed(party)) {
            return b.getSpeed(party) - a.getSpeed(party);
          } else return a.getTiebreakerId().localeCompare(b.getTiebreakerId());
        });
        break;
    }
  }

  getFirstScheduler() {
    const fastest = this.schedulers[0];
    if (fastest === undefined) throw new Error("turn scheduler list was empty");
    return fastest;
  }

  addNewSchedulerTracker(from: TaggedTurnTrackerTrackedEntityId, startingDelay: number) {
    if (from.type === TurnTrackerEntityType.Combatant) {
      throw new Error("adding new combatant turn scheduler tracker not yet implemented");
    } else if (from.type === TurnTrackerEntityType.Condition) {
      const scheduler = new ConditionTurnScheduler(from.combatantId, from.conditionId);

      scheduler.accumulatedDelay = startingDelay;
      this.schedulers.push(scheduler);
    } else if (from.type === TurnTrackerEntityType.ActionEntity) {
      const scheduler = new ActionEntityTurnScheduler(from.actionEntityId);
      scheduler.accumulatedDelay = startingDelay;
      this.schedulers.push(scheduler);
    }
  }

  buildNewList(game: SpeedDungeonGame, party: AdventuringParty) {
    this.removeStaleTurnSchedulers(party);
    for (const scheduler of this.schedulers) scheduler.reset(party);

    const turnTrackerList: TurnTracker[] = [];

    let numCombatantTrackersCreated = 0;

    const ITERATION_LIMIT = 40;
    let iterationLimiter = 0;

    while (
      numCombatantTrackersCreated < this.minTurnTrackersCount &&
      iterationLimiter < ITERATION_LIMIT
    ) {
      iterationLimiter += 1;
      this.sortSchedulers(TurnTrackerSortableProperty.TimeOfNextMove, party);

      const fastestActor = this.getFirstScheduler();

      const trackerOption = fastestActor.createTurnTrackerOption(game, party);
      if (trackerOption instanceof CombatantTurnTracker) numCombatantTrackersCreated += 1;

      if (trackerOption) turnTrackerList.push(trackerOption);
      const delay = TurnOrderManager.getActionDelayCost(
        fastestActor.getSpeed(party),
        BASE_ACTION_DELAY_MULTIPLIER
      );

      fastestActor.timeOfNextMove += delay;
    }

    return turnTrackerList;
  }
}
