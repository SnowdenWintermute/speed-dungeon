import { AdventuringParty } from "../../adventuring-party/index.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { EntityId } from "../../aliases.js";
import { BASE_ACTION_DELAY, SPEED_DELAY_RECOVERY_WEIGHT } from "./consts.js";
import { TurnSchedulerManager } from "./turn-scheduler-manager.js";
import { TurnTracker } from "./turn-trackers.js";
import { makeAutoObservable } from "mobx";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { ReactiveNode, Serializable, SerializedOf } from "../../serialization/index.js";
import { ActionUserType } from "../../action-user-context/action-user.js";

export class TurnOrderManager implements Serializable, ReactiveNode {
  private minTrackersCount: number = 12;
  private turnTrackers: TurnTracker[] = [];
  turnSchedulerManager = new TurnSchedulerManager(this.minTrackersCount);

  makeObservable(): void {
    makeAutoObservable(this);
  }

  toSerialized() {
    return {
      minTrackersCount: this.minTrackersCount,
      turnTrackers: this.turnTrackers,
      turnSchedulerManager: this.turnSchedulerManager.toSerialized(),
    };
  }

  static fromSerialized(serialized: SerializedOf<TurnOrderManager>): TurnOrderManager {
    const result = new TurnOrderManager();
    result.turnSchedulerManager = TurnSchedulerManager.fromSerialized(
      serialized.turnSchedulerManager
    );
    return result;
  }

  static getActionDelayCost(speed: number, actionDelayMultiplier: number) {
    if (speed === 0) {
      return Infinity;
    }
    const speedBonus = speed * SPEED_DELAY_RECOVERY_WEIGHT;
    const delayAfterSpeedBonus = BASE_ACTION_DELAY / (BASE_ACTION_DELAY + speedBonus);
    const delay = actionDelayMultiplier * delayAfterSpeedBonus;
    const rounded = Math.floor(delay * 10);
    return rounded;
  }

  getTrackers() {
    return this.turnTrackers;
  }

  currentActorIsPlayerControlled(party: AdventuringParty) {
    const fastestTurnOrderTracker = this.getFastestActorTurnOrderTracker();
    const taggedIdOfTrackedEntity = fastestTurnOrderTracker.getTaggedIdOfTrackedEntity();

    if (
      taggedIdOfTrackedEntity.type === ActionUserType.ActionEntity ||
      taggedIdOfTrackedEntity.type === ActionUserType.Condition
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
      taggedIdOfTrackedEntity.type === ActionUserType.Combatant &&
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
