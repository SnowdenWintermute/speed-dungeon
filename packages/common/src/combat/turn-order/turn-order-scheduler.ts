import { AdventuringParty } from "../../adventuring-party/index.js";
import { Battle } from "../../battle/index.js";
import { CombatantContext } from "../../combatant-context/index.js";
import { CombatAttribute } from "../../combatants/attributes/index.js";
import {
  Combatant,
  COMBATANT_CONDITION_NAME_STRINGS,
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
        ({ appliedTo, condition }) =>
          new TickableConditionTurnSchedulerTracker(appliedTo, condition.id)
      ),
    ];
  }

  getSchedulerTrackerByCombatantId(entityId: EntityId) {
    const filtered = this.turnSchedulerTrackers.filter(
      (item) => item instanceof CombatantTurnSchedulerTracker
    );
    const found = filtered.find((item) => item.combatantId === entityId);
    if (found === undefined) throw new Error("Expected combatant turn order scheduler not found");
    return found;
  }

  getMatchingSchedulerTrackerFromTurnOrderTracker(
    turnOrderTracker: CombatantTurnTracker | ConditionTurnTracker
  ) {
    let schedulerTrackerOption:
      | undefined
      | CombatantTurnSchedulerTracker
      | TickableConditionTurnSchedulerTracker = undefined;

    if (turnOrderTracker instanceof CombatantTurnTracker) {
      schedulerTrackerOption = this.turnSchedulerTrackers
        .filter((item) => item instanceof CombatantTurnSchedulerTracker)
        .find((item) => item.combatantId === turnOrderTracker.combatantId);
    } else {
      // condition turn tracker
      schedulerTrackerOption = this.turnSchedulerTrackers
        .filter((item) => item instanceof TickableConditionTurnSchedulerTracker)
        .find((item) => item.conditionId === turnOrderTracker.conditionId);
    }
    if (schedulerTrackerOption === undefined)
      throw new Error("expected turnSchedulerTracker was missing");
    return schedulerTrackerOption;
  }

  removeStaleTurnSchedulerTrackers(party: AdventuringParty) {
    const idsToRemove: EntityId[] = [];

    for (const tracker of this.turnSchedulerTrackers) {
      if (!(tracker instanceof TickableConditionTurnSchedulerTracker)) continue;

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

    this.turnSchedulerTrackers = this.turnSchedulerTrackers.filter((tracker) => {
      if (!(tracker instanceof TickableConditionTurnSchedulerTracker)) {
        return true;
      }

      if (idsToRemove.includes(tracker.conditionId)) return false;
      return true;
    });
  }

  resetTurnSchedulerTrackers(party: AdventuringParty) {
    this.removeStaleTurnSchedulerTrackers(party);

    for (const tracker of this.turnSchedulerTrackers) {
      // take into account any delay they've accumulated from taking actions in this battle
      tracker.timeOfNextMove = tracker.accumulatedDelay;
      const initialDelay = TurnOrderManager.getActionDelayCost(
        tracker.getSpeed(party),
        BASE_ACTION_DELAY_MULTIPLIER
      );
      // start with an initial delay
      tracker.timeOfNextMove += initialDelay;
    }
  }

  sortSchedulerTrackers(sortBy: TurnTrackerSortableProperty) {
    switch (sortBy) {
      case TurnTrackerSortableProperty.TimeOfNextMove:
        this.turnSchedulerTrackers.sort((a, b) => {
          if (a.timeOfNextMove !== b.timeOfNextMove) {
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

  addNewSchedulerTracker(
    from: Combatant | ConditionWithCombatantIdAppliedTo,
    startingDelay: number
  ) {
    if (from instanceof Combatant) {
      throw new Error("adding new combatant turn scheduler tracker not yet implemented");
    } else {
      const schedulerTracker = new TickableConditionTurnSchedulerTracker(
        from.appliedTo,
        from.condition.id
      );

      schedulerTracker.accumulatedDelay = startingDelay;
      this.turnSchedulerTrackers.push(schedulerTracker);
    }
  }

  buildNewList(party: AdventuringParty) {
    this.resetTurnSchedulerTrackers(party);

    const turnTrackerList: (CombatantTurnTracker | ConditionTurnTracker)[] = [];

    const predictedConsumedStacksOnTickByConditionId: Record<EntityId, number> = {};

    while (turnTrackerList.length < this.minTrackersCount) {
      this.sortSchedulerTrackers(TurnTrackerSortableProperty.TimeOfNextMove);
      const fastestActor = this.getFirstTracker();
      if (fastestActor instanceof CombatantTurnSchedulerTracker) {
        const combatantResult = AdventuringParty.getCombatant(party, fastestActor.combatantId);
        if (combatantResult instanceof Error) throw combatantResult;
        if (!CombatantProperties.isDead(combatantResult.combatantProperties)) {
          turnTrackerList.push(
            new CombatantTurnTracker(fastestActor.combatantId, fastestActor.timeOfNextMove)
          );
        }
      } else if (fastestActor instanceof TickableConditionTurnSchedulerTracker) {
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
              // @TODO - get the real value
              const testingTicksPredicted = 1;

              predictedConsumedStacksOnTickByConditionId[conditionId] =
                (predictedConsumedStacksOnTickByConditionId[conditionId] ?? 0) +
                testingTicksPredicted;
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

interface ITurnSchedulerTracker {
  timeOfNextMove: number;
  accumulatedDelay: number; // when they take their turn, add to this
  getSpeed: (party: AdventuringParty) => number;
}

export class CombatantTurnSchedulerTracker implements ITurnSchedulerTracker {
  timeOfNextMove: number = 0;
  accumulatedDelay: number = 0;
  constructor(public readonly combatantId: EntityId) {}
  getSpeed(party: AdventuringParty) {
    const combatantResult = AdventuringParty.getCombatant(party, this.combatantId);
    if (combatantResult instanceof Error) throw combatantResult;
    const combatantSpeed = CombatantProperties.getTotalAttributes(
      combatantResult.combatantProperties
    )[CombatAttribute.Speed];
    console.log("got combatant tick speed:", combatantSpeed);
    return combatantSpeed;
  }
}

export class TickableConditionTurnSchedulerTracker implements ITurnSchedulerTracker {
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
