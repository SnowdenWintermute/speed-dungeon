import { AdventuringParty } from "../../adventuring-party/index.js";
import { CombatantCondition } from "../../conditions/index.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { EntityId } from "../../aliases.js";
import { CombatantTurnScheduler } from "./turn-schedulers/combatant-turn-scheduler.js";
import { TurnSchedulerCreationDelay, TurnSchedulerFactory } from "./turn-scheduler-factory.js";
import { ITurnScheduler } from "./turn-schedulers/index.js";
import { TaggedTurnTrackerTrackedEntityId } from "./turn-tracker-tagged-tracked-entity-ids.js";
import { TurnTracker } from "./turn-trackers/index.js";
import { Serializable, SerializedOf } from "../../serialization/index.js";
import { ActionUserType } from "../../action-user-context/tagged-action-user-id.js";
import { invariant } from "../../utils/index.js";
import { CombatantTurnTracker } from "./turn-trackers/combatant-turn-tracker.js";

export interface TurnSchedulerIdentifier {
  turnTakerId: EntityId;
  schedulerIndex: number;
}

export class TurnSchedulerManager implements Serializable {
  private schedulers: ITurnScheduler[] = [];
  private _schedulerCurrentlyTakingTurnOption: TurnSchedulerIdentifier | undefined;

  constructor(private minTurnTrackersCount: number) {}

  toSerialized() {
    const schedulers = this.schedulers.map((scheduler) => {
      return {
        taggedEntityId: scheduler.getTaggedEntityId(),
        accumulatedDelay: scheduler.accumulatedDelay,
        schedulerIndex: scheduler.index,
        initialDelay: scheduler.initialDelay,
      };
    });

    return { minTurnTrackersCount: this.minTurnTrackersCount, schedulers };
  }

  static fromSerialized(serialized: SerializedOf<TurnSchedulerManager>): TurnSchedulerManager {
    const result = new TurnSchedulerManager(serialized.minTurnTrackersCount);
    for (const scheduler of serialized.schedulers) {
      result.addNewScheduler(scheduler.taggedEntityId, scheduler.schedulerIndex, {
        initialDelay: scheduler.initialDelay,
        accumulatedDelay: scheduler.accumulatedDelay,
      });
    }
    return result;
  }

  createSchedulersOnBattleStart(party: AdventuringParty) {
    const { combatants, tickableConditions } =
      party.combatantManager.getAllTickableConditionsAndCombatants();
    const schedulers: ITurnScheduler[] = [];

    for (const combatant of combatants.values()) {
      const schedulersToCreateCount =
        1 + (combatant.combatantProperties.extraTurnSchedulerCount || 0);
      for (
        let schedulersCreatedCount = 0;
        schedulersCreatedCount < schedulersToCreateCount;
        schedulersCreatedCount += 1
      ) {
        // @TODO -rollstarting delay
        const initialDelay = 0;

        schedulers.push(
          TurnSchedulerFactory.create(
            {
              type: ActionUserType.Combatant,
              combatantId: combatant.getEntityId(),
            },
            schedulersCreatedCount,
            {
              initialDelay,
              accumulatedDelay: 0,
            }
          )
        );
      }
    }

    // @TODO - calculate condition starting delay at battle start based on condition turns between ticks
    schedulers.push(
      ...tickableConditions.map(({ appliedTo, condition }) =>
        TurnSchedulerFactory.create(
          {
            type: ActionUserType.Condition,
            combatantId: appliedTo,
            conditionId: condition.id,
          },
          0,
          {
            initialDelay: 0,
            accumulatedDelay: 0,
          }
        )
      )
    );

    this.schedulers = schedulers;
  }

  requireSchedulerIdentifierTakingTurn() {
    invariant(
      this._schedulerCurrentlyTakingTurnOption !== undefined,
      "No turn schedulers marked as taking turn"
    );
    return this._schedulerCurrentlyTakingTurnOption;
  }

  getTurnSchedulerOption(identifier: TurnSchedulerIdentifier) {
    const schedulerOption = this.schedulers.find((value) => {
      const idsMatch = value.getTurnTakerId() === identifier.turnTakerId;
      const indicesMatch = value.index === identifier.schedulerIndex;
      return idsMatch && indicesMatch;
    });
    return schedulerOption;
  }

  getTurnSchedulerTakingTurnOption() {
    const identifier = this.requireSchedulerIdentifierTakingTurn();
    return this.getTurnSchedulerOption(identifier);
  }

  markSchedulerAsCurrentlyTakingTurn(identifier: TurnSchedulerIdentifier) {
    this._schedulerCurrentlyTakingTurnOption = identifier;
  }

  buildNewList(game: SpeedDungeonGame, party: AdventuringParty) {
    this.removeStaleTurnSchedulers(party);

    for (const scheduler of this.schedulers) {
      scheduler.reset();
    }

    const turnTrackerList: TurnTracker[] = [];

    let numCombatantTrackersCreated = 0;

    const ITERATION_LIMIT = 40;
    let iterationLimiter = 0;

    while (
      numCombatantTrackersCreated < this.minTurnTrackersCount &&
      iterationLimiter < ITERATION_LIMIT
    ) {
      iterationLimiter += 1;
      this.sortSchedulers();

      const fastestActor = this.requireFirstScheduler();

      const trackerOption = fastestActor.createTurnTrackerOption(game, party);
      if (trackerOption instanceof CombatantTurnTracker) {
        numCombatantTrackersCreated += 1;
      }

      if (trackerOption) {
        turnTrackerList.push(trackerOption);
      }

      const delay = fastestActor.requireActionUser(party).getDelayOnTurnEnded();

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

  getSchedulerOptionByEntityId(entityId: EntityId) {
    return this.schedulers.find((scheduler) => scheduler.getTurnTakerId() === entityId);
  }

  requireSchedulerByEntityId(entityId: EntityId) {
    const found = this.getSchedulerOptionByEntityId(entityId);
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

  private sortSchedulers() {
    this.schedulers.sort((a, b) => {
      if (a.timeOfNextMove !== b.timeOfNextMove) {
        return a.timeOfNextMove - b.timeOfNextMove;
      }
      if (a.getTurnTakerId() !== b.getTurnTakerId()) {
        return TurnSchedulerManager.compareByInitialDelayThenId(a, b);
      }
      return a.index - b.index;
    });
  }

  private static compareByInitialDelayThenId(a: ITurnScheduler, b: ITurnScheduler) {
    if (a.initialDelay !== b.initialDelay) {
      return a.initialDelay - b.initialDelay;
    }
    return a.getTurnTakerId().localeCompare(b.getTurnTakerId());
  }

  requireFirstScheduler() {
    const fastest = this.schedulers[0];
    invariant(fastest !== undefined, "turn scheduler list was empty");
    return fastest;
  }

  addNewScheduler(
    from: TaggedTurnTrackerTrackedEntityId,
    index: number,
    delays: TurnSchedulerCreationDelay
  ) {
    const { initialDelay, accumulatedDelay } = delays;
    const scheduler = TurnSchedulerFactory.create(from, index, { initialDelay, accumulatedDelay });
    this.schedulers.push(scheduler);
  }

  computeNewConditionStartingDelay(party: AdventuringParty) {
    // add ( one actions worth + 1 ) delay or else when we get to the endTurnAndEvaluateInputLock step
    // when we search for the fastest scheduler tracker it will find this
    // condition's tracker instead of the combatant, since we are adding the scheduler now
    // and the combatant who's action applied this condition won't update their scheduler
    // until a later step
    const schedulerTakingTurn = this.getTurnSchedulerTakingTurnOption();
    invariant(schedulerTakingTurn !== undefined, "no turn scheduler marked as current turn taker");
    // once we start getting action delay costs that are different per each action
    // we'll have to calculate this based on the current action
    const predictedDelayOfTurnInProgress = schedulerTakingTurn
      .requireActionUser(party)
      .getDelayOnTurnEnded();
    return schedulerTakingTurn.accumulatedDelay + predictedDelayOfTurnInProgress + 1;
  }

  addConditionToTurnOrder(condition: CombatantCondition, startingDelay?: number) {
    const tickPropertiesOption = condition.getTickProperties();

    if (!tickPropertiesOption) {
      return;
    }

    this.addNewScheduler(
      {
        type: ActionUserType.Condition,
        combatantId: condition.appliedTo,
        conditionId: condition.id,
      },
      0,
      {
        initialDelay: 0,
        accumulatedDelay: startingDelay || 0,
      }
    );
  }
}
