import { AdventuringParty } from "../../adventuring-party/index.js";
import { Battle } from "../../battle/index.js";
import { CombatantContext } from "../../combatant-context/index.js";
import { CombatAttribute } from "../../combatants/attributes/index.js";
import { CombatantCondition, CombatantProperties } from "../../combatants/index.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { EntityId } from "../../primatives/index.js";
import { BASE_ACTION_DELAY_MULTIPLIER } from "./consts.js";
import {
  ActionEntityTurnTracker,
  CombatantTurnTracker,
  ConditionTurnTracker,
  TaggedTurnTrackerTrackedEntityId,
  TurnOrderManager,
  TurnTracker,
  TurnTrackerEntityType,
} from "./index.js";

export enum TurnTrackerSortableProperty {
  TimeOfNextMove,
  AccumulatedDelay,
}

export interface ITurnScheduler {
  timeOfNextMove: number;
  accumulatedDelay: number; // when they take their turn, add to this
  getSpeed: (party: AdventuringParty) => number;
  getTiebreakerId: () => string;
  isStale: (party: AdventuringParty) => boolean;
  isMatch: (otherScheduler: ITurnScheduler) => boolean;
}

export class CombatantTurnScheduler implements ITurnScheduler {
  timeOfNextMove: number = 0;
  accumulatedDelay: number = 0;
  constructor(public readonly combatantId: EntityId) {}
  getTiebreakerId = () => this.combatantId;
  getSpeed(party: AdventuringParty) {
    const combatantResult = AdventuringParty.getCombatant(party, this.combatantId);
    if (combatantResult instanceof Error) throw combatantResult;
    const combatantSpeed = CombatantProperties.getTotalAttributes(
      combatantResult.combatantProperties
    )[CombatAttribute.Speed];
    return combatantSpeed;
  }

  isStale(party: AdventuringParty) {
    const combatantResult = AdventuringParty.getCombatant(party, this.combatantId);
    return (
      combatantResult instanceof Error ||
      CombatantProperties.isDead(combatantResult.combatantProperties)
    );
  }

  isMatch(otherScheduler: ITurnScheduler): boolean {
    return (
      otherScheduler instanceof CombatantTurnScheduler &&
      otherScheduler.combatantId === this.combatantId
    );
  }
}

export class ConditionTurnScheduler implements ITurnScheduler {
  timeOfNextMove: number = 0;
  accumulatedDelay: number = 0;
  constructor(
    public readonly combatantId: EntityId,
    public readonly conditionId: EntityId
  ) {}
  getTiebreakerId = () => this.conditionId;
  getSpeed(party: AdventuringParty) {
    const conditionResult = AdventuringParty.getConditionOnCombatant(
      party,
      this.combatantId,
      this.conditionId
    );
    if (conditionResult instanceof Error) {
      throw conditionResult;
    }

    const tickPropertiesOption = CombatantCondition.getTickProperties(conditionResult);

    if (tickPropertiesOption === undefined) throw new Error("expected condition to be tickable");
    return tickPropertiesOption.getTickSpeed(conditionResult);
  }

  isStale(party: AdventuringParty) {
    const combatantResult = AdventuringParty.getCombatant(party, this.combatantId);
    const combatantIsDeadOrMissing =
      combatantResult instanceof Error ||
      CombatantProperties.isDead(combatantResult.combatantProperties);
    if (combatantIsDeadOrMissing) return true;

    const conditionResult = AdventuringParty.getConditionOnCombatant(
      party,
      this.combatantId,
      this.conditionId
    );
    return conditionResult instanceof Error;
  }

  isMatch(otherScheduler: ITurnScheduler): boolean {
    return (
      otherScheduler instanceof ConditionTurnScheduler &&
      otherScheduler.conditionId === this.conditionId
    );
  }
}

export class ActionEntityTurnScheduler implements ITurnScheduler {
  timeOfNextMove: number = 0;
  accumulatedDelay: number = 0;
  constructor(public readonly actionEntityId: EntityId) {}
  getTiebreakerId = () => this.actionEntityId;
  getSpeed(party: AdventuringParty) {
    const entityOption = party.actionEntities[this.actionEntityId];
    if (entityOption === undefined) throw new Error("no action entity found");
    const { actionEntityProperties } = entityOption;
    const { actionOriginData } = actionEntityProperties;
    if (actionOriginData === undefined)
      throw new Error("expected action entity to have origin data");

    return actionOriginData.turnOrderSpeed || 0;
  }
  isStale(party: AdventuringParty) {
    const actionEntity = AdventuringParty.getActionEntity(party, this.actionEntityId);
    return actionEntity instanceof Error;
  }
  isMatch(otherScheduler: ITurnScheduler): boolean {
    return (
      otherScheduler instanceof ActionEntityTurnScheduler &&
      otherScheduler.actionEntityId === this.actionEntityId
    );
  }
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

  private resetTurnSchedulers(party: AdventuringParty) {
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
    this.resetTurnSchedulers(party);

    const turnTrackerList: TurnTracker[] = [];

    const predictedConsumedStacksOnTickByConditionId: Record<EntityId, number> = {};
    const predictedConsumedTurnsOnTickByActionEntityId: Record<EntityId, number> = {};

    let numCombatantTrackersCreated = 0;

    let iterationLimit = 0;

    while (numCombatantTrackersCreated < this.minTurnTrackersCount && iterationLimit < 40) {
      iterationLimit += 1;
      this.sortSchedulers(TurnTrackerSortableProperty.TimeOfNextMove, party);

      const fastestActor = this.getFirstScheduler();

      // @REFACTOR

      if (fastestActor instanceof CombatantTurnScheduler) {
        const combatantResult = AdventuringParty.getCombatant(party, fastestActor.combatantId);
        if (combatantResult instanceof Error) throw combatantResult;
        const isDead = CombatantProperties.isDead(combatantResult.combatantProperties);
        if (!isDead) {
          turnTrackerList.push(
            new CombatantTurnTracker(fastestActor.combatantId, fastestActor.timeOfNextMove)
          );
          numCombatantTrackersCreated += 1;
        } else {
          fastestActor.timeOfNextMove += 1; // trying this since a combatant dying with too much speed caused infinite loop
          fastestActor.accumulatedDelay += 1;
        }
      } else if (fastestActor instanceof ConditionTurnScheduler) {
        const { combatantId, conditionId, timeOfNextMove } = fastestActor;
        const conditionResult = AdventuringParty.getConditionOnCombatant(
          party,
          combatantId,
          conditionId
        );
        if (conditionResult instanceof Error) throw conditionResult;
        const condition = conditionResult;
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
      } else if (fastestActor instanceof ActionEntityTurnScheduler) {
        const { actionEntityId, timeOfNextMove } = fastestActor;
        const actionEntityResult = AdventuringParty.getActionEntity(party, actionEntityId);
        if (actionEntityResult instanceof Error) throw actionEntityResult;
        const actionEntity = actionEntityResult;

        const { actionOriginData } = actionEntity.actionEntityProperties;
        if (actionOriginData === undefined)
          throw new Error("expected actionOriginData for an action entity with a turn scheduler");
        if (actionOriginData.stacks === undefined) throw new Error("expected action entity stacks");

        const turnsRemaining = actionOriginData.stacks.current || 0;

        let shouldPush = !!turnsRemaining;
        if (turnsRemaining) {
          // see how it's done for conditions, similar reasoning about how to not show trackers for turns that
          // won't happen since they'll have run out of turns
          const predictedConsumedTurns =
            predictedConsumedTurnsOnTickByActionEntityId[actionEntityId] ?? 0;

          if (predictedConsumedTurns >= turnsRemaining) {
            shouldPush = false;
          } else {
            const numberOfTurnsConsumed = 1;
            predictedConsumedTurnsOnTickByActionEntityId[actionEntityId] =
              (predictedConsumedTurnsOnTickByActionEntityId[actionEntityId] ?? 0) +
              numberOfTurnsConsumed;
          }
        }

        if (shouldPush)
          turnTrackerList.push(new ActionEntityTurnTracker(actionEntityId, timeOfNextMove));
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
