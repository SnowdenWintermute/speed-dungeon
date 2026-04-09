import { AdventuringParty } from "../../adventuring-party/index.js";
import { CombatantCondition } from "../../conditions/index.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { EntityId } from "../../aliases.js";
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
import { throwIfLoopLimitReached } from "../../utils/index.js";

export enum TurnTrackerSortableProperty {
  TimeOfNextMove,
  AccumulatedDelay,
}

export class TurnSchedulerManager {
  private schedulers: ITurnScheduler[] = [];

  constructor(private minTurnTrackersCount: number) {}

  createSchedulers(party: AdventuringParty) {
    const { combatants, tickableConditions } =
      party.combatantManager.getAllTickableConditionsAndCombatants();

    this.schedulers = [
      ...[...combatants.values()].map(
        (combatant) => new CombatantTurnScheduler(combatant.getEntityId())
      ),
      ...tickableConditions.map(
        ({ appliedTo, condition }) => new ConditionTurnScheduler(appliedTo, condition.id)
      ),
    ];
  }

  buildNewList(game: SpeedDungeonGame, party: AdventuringParty) {
    this.removeStaleTurnSchedulers(party);

    for (const scheduler of this.schedulers) {
      scheduler.reset(party);
    }

    // sort a copy so the canonical schedulers array order is preserved across builds.
    // mutating this.schedulers via sort would cause tied entries to flip-flop between
    // builds, since stable sort preserves the current array order — and the underlying
    // order would be whatever the previous build's iterative bumping left behind.
    // capture the canonical insertion index for each scheduler so the sort uses it as
    // a deterministic final tie-break — without it, repeated sorts within this build
    // (whose workingList order changes after each iteration's bump) would cause
    // predicted upcoming turns to oscillate even when the actor selection is correct.
    const insertionIndex = new Map<ITurnScheduler, number>();
    this.schedulers.forEach((s, i) => insertionIndex.set(s, i));
    const workingList = [...this.schedulers];

    const turnTrackerList: TurnTracker[] = [];

    let numCombatantTrackersCreated = 0;

    let iterationLimiter = 0;
    while (numCombatantTrackersCreated < this.minTurnTrackersCount) {
      throwIfLoopLimitReached(iterationLimiter, "turn-scheduler-manager buildNewList");
      iterationLimiter += 1;
      this.sortSchedulerList(
        workingList,
        TurnTrackerSortableProperty.TimeOfNextMove,
        party,
        insertionIndex
      );

      const fastestActor = workingList[0];
      if (fastestActor === undefined) throw new Error("turn scheduler list was empty");

      const trackerOption = fastestActor.createTurnTrackerOption(game, party);
      if (trackerOption instanceof CombatantTurnTracker) {
        numCombatantTrackersCreated += 1;
      }

      if (trackerOption) {
        turnTrackerList.push(trackerOption);
      }

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
      (scheduler): scheduler is CombatantTurnScheduler =>
        scheduler instanceof CombatantTurnScheduler
    );

    const found = filtered.find((scheduler) => scheduler.combatantId === entityId);
    if (found === undefined) throw new Error("Expected combatant turn order scheduler not found");
    return found;
  }

  getMatchingSchedulerFromTurnOrderTracker(turnOrderTracker: TurnTracker) {
    const schedulerOption = turnOrderTracker.getMatchingScheduler(this.schedulers);
    if (schedulerOption === undefined) {
      throw new Error("expected turnSchedulerTracker was missing");
    }
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

  private sortSchedulerList(
    list: ITurnScheduler[],
    sortBy: TurnTrackerSortableProperty,
    party: AdventuringParty,
    insertionIndex: Map<ITurnScheduler, number>
  ) {
    const tieBreakByInsertion = (a: ITurnScheduler, b: ITurnScheduler) =>
      (insertionIndex.get(a) ?? 0) - (insertionIndex.get(b) ?? 0);
    switch (sortBy) {
      case TurnTrackerSortableProperty.TimeOfNextMove:
        list.sort((a, b) => {
          if (a.timeOfNextMove !== b.timeOfNextMove) {
            return a.timeOfNextMove - b.timeOfNextMove;
          } else if (a.getSpeed(party) !== b.getSpeed(party)) {
            return b.getSpeed(party) - a.getSpeed(party);
          } else return tieBreakByInsertion(a, b);
        });
        break;
      case TurnTrackerSortableProperty.AccumulatedDelay:
        list.sort((a, b) => {
          if (a.accumulatedDelay !== b.accumulatedDelay)
            return a.accumulatedDelay - b.accumulatedDelay;
          else if (a.getSpeed(party) !== b.getSpeed(party)) {
            return b.getSpeed(party) - a.getSpeed(party);
          } else return tieBreakByInsertion(a, b);
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

  addConditionToTurnOrder(
    party: AdventuringParty,
    condition: CombatantCondition,
    options?: { withCustomStartingDelay?: number }
  ) {
    const tickPropertiesOption = condition.getTickProperties();

    if (!tickPropertiesOption) return;

    let startingDelay = options?.withCustomStartingDelay || 0;

    if (options?.withCustomStartingDelay === undefined) {
      // add ( one actions worth + 1 ) delay or else when we get to the endTurnAndEvaluateInputLock step
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
      startingDelay = combatantApplyingAccumulatedDelay + appliedByPredictedAdditionalDelay + 1;
    }

    this.addNewScheduler(
      {
        type: TurnTrackerEntityType.Condition,
        combatantId: condition.appliedTo,
        conditionId: condition.id,
      },
      startingDelay
    );
  }
}
