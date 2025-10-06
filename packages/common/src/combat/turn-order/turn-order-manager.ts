import { AdventuringParty } from "../../adventuring-party/index.js";
import { Battle } from "../../battle/index.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { EntityId, Milliseconds } from "../../primatives/index.js";
import { CombatActionName } from "../combat-actions/combat-action-names.js";
import {
  BASE_ACTION_DELAY,
  BASE_ACTION_DELAY_MULTIPLIER,
  SPEED_DELAY_RECOVERY_WEIGHT,
} from "./consts.js";
import { TurnTrackerEntityType } from "./turn-tracker-tagged-tracked-entity-ids.js";
import { TurnSchedulerManager } from "./turn-scheduler-manager.js";
import { TurnTracker } from "./turn-trackers.js";

export class TurnOrderManager {
  private minTrackersCount: number = 12;
  turnSchedulerManager: TurnSchedulerManager;
  private turnTrackers: TurnTracker[] = [];
  constructor(game: SpeedDungeonGame, party: AdventuringParty, battle: Battle) {
    this.turnSchedulerManager = new TurnSchedulerManager(this.minTrackersCount, game, battle);
    this.updateTrackers(game, party);
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

    if (actionNameOption) scheduler.accumulatedDelay += delay;

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

    const expectedCombatant = AdventuringParty.getExpectedCombatant(
      party,
      taggedIdOfTrackedEntity.combatantId
    );
    return expectedCombatant.combatantProperties.aiTypes === undefined;
  }

  combatantIsFirstInTurnOrder(combatantId: EntityId) {
    const fastest = this.getFastestActorTurnOrderTracker();
    const taggedIdOfTrackedEntity = fastest.getTaggedIdOfTrackedEntity();
    return (
      taggedIdOfTrackedEntity.type === TurnTrackerEntityType.Combatant &&
      taggedIdOfTrackedEntity.combatantId === combatantId
    );
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
