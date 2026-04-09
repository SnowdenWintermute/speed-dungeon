import { AdventuringParty } from "../../adventuring-party/index.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { EntityId, Milliseconds } from "../../aliases.js";
import {
  COMBAT_ACTION_NAME_STRINGS,
  CombatActionName,
} from "../combat-actions/combat-action-names.js";
import {
  BASE_ACTION_DELAY,
  BASE_ACTION_DELAY_MULTIPLIER,
  SPEED_DELAY_RECOVERY_WEIGHT,
} from "./consts.js";
import { TurnTrackerEntityType } from "./turn-tracker-tagged-tracked-entity-ids.js";
import { TurnSchedulerManager } from "./turn-scheduler-manager.js";
import { TurnTracker } from "./turn-trackers.js";
import { makeAutoObservable } from "mobx";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { ReactiveNode } from "../../serialization/index.js";

export class TurnOrderManager implements ReactiveNode {
  private minTrackersCount: number = 12;
  private turnTrackers: TurnTracker[] = [];
  turnSchedulerManager = new TurnSchedulerManager(this.minTrackersCount);

  makeObservable(): void {
    makeAutoObservable(this);
  }

  static getActionDelayCost(speed: number, actionDelayMultiplier: number) {
    const speedBonus = speed * SPEED_DELAY_RECOVERY_WEIGHT;
    const delayAfterSpeedBonus = BASE_ACTION_DELAY / (BASE_ACTION_DELAY + speedBonus);
    const delay = actionDelayMultiplier * delayAfterSpeedBonus;
    const rounded = Math.floor(delay * 10);
    return rounded;
  }

  getTrackers() {
    return this.turnTrackers;
  }

  updateFastestSchedulerWithExecutedActionDelay(
    party: AdventuringParty,
    actionNameOption: null | CombatActionName
  ): Milliseconds {
    const fastest = this.getFastestActorTurnOrderTracker();
    const scheduler = this.turnSchedulerManager.getMatchingSchedulerFromTurnOrderTracker(fastest);

    let speedResult = 0;
    try {
      speedResult = scheduler.getSpeed(party);
    } catch (err) {
      console.info("couldn't get tracker speed, maybe its associated entity was already removed");
    }

    // @TODO - get delay multiplier from action
    const delay = TurnOrderManager.getActionDelayCost(speedResult, BASE_ACTION_DELAY_MULTIPLIER);

    if (actionNameOption) {
      scheduler.accumulatedDelay += delay;
    }

    return delay;
  }

  currentActorIsPlayerControlled(party: AdventuringParty) {
    const fastestTurnOrderTracker = this.getFastestActorTurnOrderTracker();
    const taggedIdOfTrackedEntity = fastestTurnOrderTracker.getTaggedIdOfTrackedEntity();

    if (
      taggedIdOfTrackedEntity.type === TurnTrackerEntityType.ActionEntity ||
      taggedIdOfTrackedEntity.type === TurnTrackerEntityType.Condition
    ) {
      return false;
    }

    const expectedCombatant = party.combatantManager.getExpectedCombatant(
      taggedIdOfTrackedEntity.combatantId
    );

    return expectedCombatant.combatantProperties.controlledBy.isPlayerControlled();
  }

  combatantIsFirstInTurnOrder(combatantId: EntityId) {
    const fastest = this.getFastestActorTurnOrderTracker();
    const taggedIdOfTrackedEntity = fastest.getTaggedIdOfTrackedEntity();
    return (
      taggedIdOfTrackedEntity.type === TurnTrackerEntityType.Combatant &&
      taggedIdOfTrackedEntity.combatantId === combatantId
    );
  }

  requireActionUserFirstInTurnOrder(id: EntityId) {
    const isCombatantTurn = this.combatantIsFirstInTurnOrder(id);
    if (!isCombatantTurn) {
      console.info(`
      actual first action user: ${this.getFastestActorTurnOrderTracker().getEntityId()},
      you attempted to move as ${id}`);

      throw new Error(`${ERROR_MESSAGES.COMBATANT.NOT_ACTIVE}`);
    }
  }

  updateTrackers(game: SpeedDungeonGame, party: AdventuringParty) {
    const newList = this.turnSchedulerManager.buildNewList(game, party);
    this.turnTrackers = newList;
  }

  getFastestActorTurnOrderTracker() {
    const fastest = this.turnTrackers[0];
    if (!fastest) throw new Error("turn trackers were empty");
    return fastest;
  }

  // on action taken
  // - remove first turn tracker
  // - remove any dead combatant trackers and their conditions
  // - animate fill to left
  // - predict missing trackers and fill them
  diffTurnTrackers(newTrackers: TurnTracker[]) {
    const oldTrackers = this.turnTrackers;
    const oldIds = oldTrackers.map((tracker) => tracker.getId());
    const newIds = newTrackers.map((tracker) => tracker.getId());

    const removedTrackerIds = oldIds.filter((id) => !newIds.includes(id));
    const addedTrackers = newTrackers.filter((tracker) => !oldIds.includes(tracker.getId()));
    const persistedTrackers = newTrackers.filter((tracker) => oldIds.includes(tracker.getId()));

    return { removedTrackerIds, persistedTrackers, addedTrackers };
  }
  aggregateConditionTrackersTiedForFirst() {}
}
