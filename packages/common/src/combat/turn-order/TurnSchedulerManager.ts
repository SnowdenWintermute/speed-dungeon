import {
  TurnTracker,
  CombatantTurnTracker,
  ConditionTurnTracker,
  TurnOrderManager,
  TurnTrackerEntityType,
  TaggedTurnTrackerTrackedEntityId,
  ActionEntityTurnTracker,
} from "../index.js";
import { AdventuringParty } from "../../adventuring-party/index.js";
import { Battle } from "../../battle/index.js";
import { CombatantContext } from "../../combatant-context/index.js";
import {
  CombatantProperties,
  Combatant,
  ConditionWithCombatantIdAppliedTo,
  CombatantCondition,
} from "../../combatants/index.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { EntityId } from "../../primatives/index.js";
import { BASE_ACTION_DELAY_MULTIPLIER } from "./consts.js";
import {
  ActionEntityTurnScheduler,
  CombatantTurnScheduler,
  ConditionTurnScheduler,
  ITurnScheduler,
  TurnTrackerSortableProperty,
} from "./turn-scheduler-manager.js";
import { ActionEntityActionOriginData } from "../../action-entities/index.js";

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
    let schedulerOption: undefined | ITurnScheduler = undefined;

    const taggedIdOfTrackedEntity = turnOrderTracker.getTaggedIdOfTrackedEntity();

    switch (taggedIdOfTrackedEntity.type) {
      case TurnTrackerEntityType.Combatant:
        schedulerOption = this.schedulers
          .filter((item) => item instanceof CombatantTurnScheduler)
          .find((item) => item.combatantId === taggedIdOfTrackedEntity.combatantId);
        break;
      case TurnTrackerEntityType.Condition:
        schedulerOption = this.schedulers
          .filter((item) => item instanceof ConditionTurnScheduler)
          .find((item) => item.conditionId === taggedIdOfTrackedEntity.conditionId);
        break;
      case TurnTrackerEntityType.ActionEntity:
        schedulerOption = this.schedulers
          .filter((item) => item instanceof ActionEntityTurnScheduler)
          .find((item) => item.actionEntityId === taggedIdOfTrackedEntity.actionEntityId);
        break;
    }

    if (schedulerOption === undefined) throw new Error("expected turnSchedulerTracker was missing");
    return schedulerOption;
  }

  removeStaleTurnSchedulers(party: AdventuringParty) {
    const idsToRemove: TaggedTurnTrackerTrackedEntityId[] = [];

    for (const scheduler of this.schedulers) {
      if (scheduler instanceof CombatantTurnScheduler) {
        const combatantResult = AdventuringParty.getCombatant(party, scheduler.combatantId);
        if (
          combatantResult instanceof Error ||
          CombatantProperties.isDead(combatantResult.combatantProperties)
        ) {
          idsToRemove.push({
            type: TurnTrackerEntityType.Combatant,
            combatantId: scheduler.combatantId,
          });
        }
        continue;
      } else if (scheduler instanceof ConditionTurnScheduler) {
        const conditionResult = AdventuringParty.getConditionOnCombatant(
          party,
          scheduler.combatantId,
          scheduler.conditionId
        );
        if (conditionResult instanceof Error)
          idsToRemove.push({
            type: TurnTrackerEntityType.Condition,
            conditionId: scheduler.conditionId,
            combatantId: scheduler.combatantId,
          });
      } else if (scheduler instanceof ActionEntityTurnScheduler) {
        const actionEntity = AdventuringParty.getActionEntity(party, scheduler.actionEntityId);
        if (actionEntity instanceof Error) {
          console.log("removeStaleTurnSchedulers action entity:", scheduler.actionEntityId);
          idsToRemove.push({
            type: TurnTrackerEntityType.ActionEntity,
            actionEntityId: scheduler.actionEntityId,
          });
        }
      }
    }

    this.schedulers = this.schedulers.filter((scheduler) => {
      if (scheduler instanceof CombatantTurnScheduler) {
        for (const taggedId of idsToRemove) {
          if (
            taggedId.type === TurnTrackerEntityType.Combatant &&
            scheduler.combatantId === taggedId.combatantId
          )
            return false;
        }
        return true;
      } else if (scheduler instanceof ConditionTurnScheduler) {
        for (const taggedId of idsToRemove) {
          if (
            taggedId.type === TurnTrackerEntityType.Condition &&
            scheduler.conditionId === taggedId.conditionId
          )
            return false;
        }
        return true;
      } else if (scheduler instanceof ActionEntityTurnScheduler) {
        for (const taggedId of idsToRemove) {
          if (
            taggedId.type === TurnTrackerEntityType.ActionEntity &&
            scheduler.actionEntityId === taggedId.actionEntityId
          )
            return false;
        }
        return true;
      }

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

  sortSchedulers(sortBy: TurnTrackerSortableProperty, party: AdventuringParty) {
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
        console.log("action entity turn scheduler");
        const { actionEntityId, timeOfNextMove } = fastestActor;
        const actionEntityResult = AdventuringParty.getActionEntity(party, actionEntityId);
        if (actionEntityResult instanceof Error) throw actionEntityResult;
        const actionEntity = actionEntityResult;

        const { actionOriginData } = actionEntity.actionEntityProperties;
        if (actionOriginData === undefined)
          throw new Error("expected actionOriginData for an action entity with a turn scheduler");

        const turnsRemaining = actionOriginData.turnsRemaining || 0;

        console.log("action entity turns remaining:", turnsRemaining);

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

        console.log("action entity:", actionEntityId, "should push tracker:", shouldPush);

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
