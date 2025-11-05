import { AdventuringParty } from "../../adventuring-party/index.js";
import { CombatantCondition } from "../../combatants/index.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { EntityId } from "../../primatives/index.js";
import { CombatantTurnScheduler } from "./combatant-turn-scheduler.js";
import { ConditionTurnScheduler } from "./condition-turn-scheduler.js";
import { BASE_ACTION_DELAY_MULTIPLIER } from "./consts.js";
import { TurnOrderManager } from "./turn-order-manager.js";
import { TurnSchedulerFactory } from "./turn-scheduler-factory.js";
import { ITurnScheduler } from "./turn-schedulers.js";
import {
  TaggedTurnTrackerTrackedEntityId,
  TurnTrackerEntityType,
} from "./turn-tracker-tagged-tracked-entity-ids.js";
import { CombatantTurnTracker, TurnTracker } from "./turn-trackers.js";

export enum TurnTrackerSortableProperty {
  TimeOfNextMove,
  AccumulatedDelay,
}

export class TurnSchedulerManager {
  private schedulers: ITurnScheduler[] = [];

  constructor(
    private minTurnTrackersCount: number,
    party: AdventuringParty
  ) {
    const { combatants, tickableConditions } =
      party.combatantManager.getAllTickableConditionsAndCombatants();

    this.schedulers = [
      ...combatants.map((combatant) => new CombatantTurnScheduler(combatant.entityProperties.id)),
      ...tickableConditions.map(
        ({ appliedTo, condition }) => new ConditionTurnScheduler(appliedTo, condition.id)
      ),
    ];
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

  addNewScheduler(from: TaggedTurnTrackerTrackedEntityId, startingDelay: number) {
    const scheduler = TurnSchedulerFactory.create(from, startingDelay);
    this.schedulers.push(scheduler);
  }

  addConditionToTurnOrder(party: AdventuringParty, condition: CombatantCondition) {
    const tickPropertiesOption = condition.getTickProperties();

    if (!tickPropertiesOption) return;

    // add one actions worth + 1 delay or else when we get to the endTurnAndEvaluateInputLock step
    // when we search for the fastest scheduler tracker it will find this
    // condition's tracker instead of the combatant, since we are adding the scheduler now
    // and the combatant who's action applied this condition won't update their scheduler
    // until a later step
    const appliedByScheduler = this.getSchedulerByCombatantId(
      condition.appliedBy.entityProperties.id
    );

    // once we start getting action delay costs that are different per each action
    // we'll have to calculate this based on the current action
    const appliedByPredictedAdditionalDelay = TurnOrderManager.getActionDelayCost(
      appliedByScheduler.getSpeed(party),
      BASE_ACTION_DELAY_MULTIPLIER
    );

    const combatantApplyingAccumulatedDelay = appliedByScheduler.accumulatedDelay;

    this.addNewScheduler(
      {
        type: TurnTrackerEntityType.Condition,
        combatantId: condition.appliedTo,
        conditionId: condition.id,
      },
      combatantApplyingAccumulatedDelay + appliedByPredictedAdditionalDelay + 1
    );
  }
}
