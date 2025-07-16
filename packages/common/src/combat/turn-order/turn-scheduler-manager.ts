import { AdventuringParty } from "../../adventuring-party/index.js";
import { Battle } from "../../battle/index.js";
import { CombatantContext } from "../../combatant-context/index.js";
import { CombatAttribute } from "../../combatants/attributes/index.js";
import {
  Combatant,
  CombatantCondition,
  CombatantProperties,
  ConditionWithCombatantIdAppliedTo,
} from "../../combatants/index.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { EntityId } from "../../primatives/index.js";
import { BASE_ACTION_DELAY_MULTIPLIER } from "./consts.js";
import { CombatantTurnTracker, ConditionTurnTracker, TurnOrderManager } from "./index.js";

export enum TurnTrackerSortableProperty {
  TimeOfNextMove,
  AccumulatedDelay,
}

export class TurnSchedulerManager {
  schedulers: (CombatantTurnScheduler | ConditionTurnScheduler)[] = [];

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

  getMatchingSchedulerFromTurnOrderTracker(
    turnOrderTracker: CombatantTurnTracker | ConditionTurnTracker
  ) {
    let schedulerOption: undefined | CombatantTurnScheduler | ConditionTurnScheduler = undefined;

    if (turnOrderTracker instanceof CombatantTurnTracker) {
      schedulerOption = this.schedulers
        .filter((item) => item instanceof CombatantTurnScheduler)
        .find((item) => item.combatantId === turnOrderTracker.combatantId);
    } else {
      // condition turn tracker
      schedulerOption = this.schedulers
        .filter((item) => item instanceof ConditionTurnScheduler)
        .find((item) => item.conditionId === turnOrderTracker.conditionId);
    }
    if (schedulerOption === undefined) throw new Error("expected turnSchedulerTracker was missing");
    return schedulerOption;
  }

  removeStaleTurnSchedulers(party: AdventuringParty) {
    const idsToRemove: EntityId[] = [];

    for (const tracker of this.schedulers) {
      if (!(tracker instanceof ConditionTurnScheduler)) continue;

      try {
        const conditionExists = AdventuringParty.getConditionOnCombatant(
          party,
          tracker.combatantId,
          tracker.conditionId
        );
      } catch (err) {
        idsToRemove.push(tracker.conditionId);
      }
    }

    this.schedulers = this.schedulers.filter((scheduler) => {
      if (!(scheduler instanceof ConditionTurnScheduler)) {
        return true;
      }

      if (idsToRemove.includes(scheduler.conditionId)) return false;
      return true;
    });
  }

  resetTurnSchedulers(party: AdventuringParty) {
    this.removeStaleTurnSchedulers(party);

    for (const scheduler of this.schedulers) {
      // take into account any delay they've accumulated from taking actions in this battle
      scheduler.timeOfNextMove = scheduler.accumulatedDelay;
      const initialDelay = TurnOrderManager.getActionDelayCost(
        scheduler.getSpeed(party),
        BASE_ACTION_DELAY_MULTIPLIER
      );
      // start with an initial delay
      scheduler.timeOfNextMove += initialDelay;
    }
  }

  sortSchedulers(sortBy: TurnTrackerSortableProperty) {
    switch (sortBy) {
      case TurnTrackerSortableProperty.TimeOfNextMove:
        this.schedulers.sort((a, b) => {
          if (a.timeOfNextMove !== b.timeOfNextMove) {
            return a.timeOfNextMove - b.timeOfNextMove;
          } else return a.combatantId.localeCompare(b.combatantId);
        });
        break;
      case TurnTrackerSortableProperty.AccumulatedDelay:
        this.schedulers.sort((a, b) => {
          if (a.accumulatedDelay !== b.accumulatedDelay)
            return a.accumulatedDelay - b.accumulatedDelay;
          else return a.combatantId.localeCompare(b.combatantId);
        });
        break;
    }
  }

  getFirstScheduler() {
    const fastest = this.schedulers[0];
    if (fastest === undefined) throw new Error("turn scheduler list was empty");
    return fastest;
  }

  addNewSchedulerTracker(
    from: Combatant | ConditionWithCombatantIdAppliedTo,
    startingDelay: number
  ) {
    if (from instanceof Combatant) {
      throw new Error("adding new combatant turn scheduler tracker not yet implemented");
    } else {
      const scheduler = new ConditionTurnScheduler(from.appliedTo, from.condition.id);

      scheduler.accumulatedDelay = startingDelay;
      this.schedulers.push(scheduler);
    }
  }

  buildNewList(game: SpeedDungeonGame, party: AdventuringParty) {
    this.resetTurnSchedulers(party);

    const turnTrackerList: (CombatantTurnTracker | ConditionTurnTracker)[] = [];

    const predictedConsumedStacksOnTickByConditionId: Record<EntityId, number> = {};

    while (turnTrackerList.length < this.minTurnTrackersCount) {
      this.sortSchedulers(TurnTrackerSortableProperty.TimeOfNextMove);
      const fastestActor = this.getFirstScheduler();
      if (fastestActor instanceof CombatantTurnScheduler) {
        const combatantResult = AdventuringParty.getCombatant(party, fastestActor.combatantId);
        if (combatantResult instanceof Error) throw combatantResult;
        if (!CombatantProperties.isDead(combatantResult.combatantProperties)) {
          turnTrackerList.push(
            new CombatantTurnTracker(fastestActor.combatantId, fastestActor.timeOfNextMove)
          );
        }
      } else if (fastestActor instanceof ConditionTurnScheduler) {
        const { combatantId, conditionId, timeOfNextMove } = fastestActor;
        const condition = AdventuringParty.getConditionOnCombatant(party, combatantId, conditionId);
        const stacksRemaining = condition.stacksOption?.current;

        let shouldPush = true;

        if (stacksRemaining) {
          // check how many previous trackers we've pushed for this condition and how many stacks they would consume
          // only push if we haven't maxed out yet
          // record expected stacks consumed for this condition on its turn
          const predictedConsumedStacks =
            predictedConsumedStacksOnTickByConditionId[conditionId] ?? 0;

          if (predictedConsumedStacks >= stacksRemaining) {
            shouldPush = false;
          } else {
            const tickPropertiesOption = CombatantCondition.getTickProperties(condition);
            if (tickPropertiesOption) {
              const combatantAppliedToResult = AdventuringParty.getCombatant(party, combatantId);
              if (combatantAppliedToResult instanceof Error) throw combatantAppliedToResult;

              const ticksPredicted = tickPropertiesOption.onTick(
                condition,
                new CombatantContext(game, party, combatantAppliedToResult)
              ).numStacksRemoved;

              predictedConsumedStacksOnTickByConditionId[conditionId] =
                (predictedConsumedStacksOnTickByConditionId[conditionId] ?? 0) + ticksPredicted;
            }
          }
        }

        if (shouldPush)
          turnTrackerList.push(new ConditionTurnTracker(combatantId, conditionId, timeOfNextMove));
      }

      const delay = TurnOrderManager.getActionDelayCost(
        fastestActor.getSpeed(party),
        BASE_ACTION_DELAY_MULTIPLIER
      );

      fastestActor.timeOfNextMove += delay;
    }

    return turnTrackerList;
  }
}

interface ITurnScheduler {
  timeOfNextMove: number;
  accumulatedDelay: number; // when they take their turn, add to this
  getSpeed: (party: AdventuringParty) => number;
}

export class CombatantTurnScheduler implements ITurnScheduler {
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

export class ConditionTurnScheduler implements ITurnScheduler {
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

    const tickPropertiesOption = CombatantCondition.getTickProperties(conditionResult);

    if (tickPropertiesOption === undefined) throw new Error("expected condition to be tickable");
    return tickPropertiesOption.getTickSpeed(conditionResult);
  }
}
