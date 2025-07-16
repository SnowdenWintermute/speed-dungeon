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
import { TurnOrderScheduler } from "./turn-order-scheduler.js";

export class TurnOrderManager {
  minTrackersCount: number = 12;
  turnOrderScheduler: TurnOrderScheduler;
  turnTrackers: (CombatantTurnTracker | ConditionTurnTracker)[] = [];
  constructor(game: SpeedDungeonGame, party: AdventuringParty, battle: Battle) {
    this.turnOrderScheduler = new TurnOrderScheduler(this.minTrackersCount, game, battle);
    this.updateTrackers(game, party);
  }

  static getActionDelayCost(speed: number, actionDelayMultiplier: number) {
    const speedBonus = speed * SPEED_DELAY_RECOVERY_WEIGHT;
    const delayAfterSpeedBonus = BASE_ACTION_DELAY / (BASE_ACTION_DELAY + speedBonus);
    const delay = actionDelayMultiplier * delayAfterSpeedBonus;
    const rounded = Math.floor(delay * 10);
    return rounded;
  }

  updateSchedulerWithExecutedActionDelay(
    party: AdventuringParty,
    actionNameOption: null | CombatActionName
  ): Milliseconds {
    const fastest = this.getFastestActorTurnOrderTracker();
    console.log("fastest turn order tracker:", fastest);
    const tracker =
      this.turnOrderScheduler.getMatchingSchedulerTrackerFromTurnOrderTracker(fastest);

    // @TODO - get delay multiplier from action
    const delay = TurnOrderManager.getActionDelayCost(
      tracker.getSpeed(party),
      BASE_ACTION_DELAY_MULTIPLIER
    );

    console.log("adding delay:", delay, "to scheduler:", tracker);

    tracker.accumulatedDelay += delay;

    return delay;
  }

  currentActorIsPlayerControlled(party: AdventuringParty) {
    const fastestTurnOrderTracker = this.getFastestActorTurnOrderTracker();
    if (fastestTurnOrderTracker instanceof ConditionTurnTracker) {
      return false;
    }
    return party.characterPositions.includes(fastestTurnOrderTracker.combatantId);
  }

  combatantIsFirstInTurnOrder(combatantId: EntityId) {
    const fastest = this.getFastestActorTurnOrderTracker();
    return fastest instanceof CombatantTurnTracker && fastest.combatantId === combatantId;
  }

  updateTrackers(game: SpeedDungeonGame, party: AdventuringParty) {
    const newList = this.turnOrderScheduler.buildNewList(game, party);
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
  diffTurnTrackers(newTrackers: (CombatantTurnTracker | ConditionTurnTracker)[]) {
    const oldTrackers = this.turnTrackers;
    const oldIds = oldTrackers.map((tracker) => tracker.getId());
    const newIds = newTrackers.map((tracker) => tracker.getId());

    const removedTrackerIds = oldIds.filter((id) => !newIds.includes(id));
    const addedTrackers = newTrackers.filter((tracker) => !oldIds.includes(tracker.getId()));
    const persistedTrackers = newTrackers.filter((tracker) => oldIds.includes(tracker.getId()));

    return { removedTrackerIds, persistedTrackers, addedTrackers };
  }
  aggregateConditionTrackersTiedForFirst() {}

  // server ticks combat until next tracker
  // - if is combatant, take their AI turn or wait for user input
  // - if is condition
  //   * aggregate any conditions with the same amount of movement and process their branching actions "simultaneously"
  //   * push any conditions with no more ticks remaining to list of removed trackers
  // - accumulate a list of removed trackers
  // - accumulate list of added trackers
  // - update trackers list with the accumulated lists
  // - send lists to client
  // - client animates any action replays
  // - client animates removal of trackers and additions of new trackers
  // - if conditions, client updates their aggregated condition turn markers until no markers are left, then
  // removes the aggregated condition marker
  //
  // Turn Order Update Events
  // - tracker deletions
  // - tracker translations toward left (consolidation)
  // - new tracker fadeins
  // - first tracker in order scales and translates
  //
}

export abstract class TurnTracker {
  constructor(
    public readonly combatantId: string,
    public readonly timeOfNextMove: number
  ) {}

  getCombatant(party: AdventuringParty) {
    const combatantResult = AdventuringParty.getCombatant(party, this.combatantId);

    if (combatantResult instanceof Error) throw combatantResult;
    return combatantResult;
  }

  getId() {
    const id = this.timeOfNextMove.toFixed(3) + "--" + this.combatantId;
    return id;
  }
}

export class CombatantTurnTracker extends TurnTracker {
  constructor(combatantId: string, timeOfNextMove: number) {
    super(combatantId, timeOfNextMove);
  }
}

export class ConditionTurnTracker extends TurnTracker {
  constructor(
    combatantId: EntityId,
    public readonly conditionId: EntityId,
    public readonly timeOfNextMove: number
  ) {
    super(combatantId, timeOfNextMove);
  }

  getCondition(party: AdventuringParty) {
    console.log("condition turn tracker trying to get condition, conditionId", this.conditionId);
    const result = AdventuringParty.getConditionOnCombatant(
      party,
      this.combatantId,
      this.conditionId
    );
    if (result instanceof Error) throw result;
    return result;
  }

  getSpeed(): number {
    return 0;
  }

  getId() {
    return this.timeOfNextMove + this.conditionId;
  }
}

// [] () () ()
//
// FTK turn trackers behavior
// - combatant finishes turn (all action animations resolve)
// - combatant turn marker is instantly removed
// - any killed combatatant's markers are removed, leaving a gap behind
// - turn markers are animated to close space between them by moving toward the front (left side)
//   * the (now) first marker only moves to the left enough to cover the marginRight of the previously first one
// - new turn markers are pushed in predicted turn order (sorted by speed)
// to the end and faded in to fill the minimum of 12 markers
// - the (now) first marker animates moving one more to the left and scaling up while all other markers animate translating
// left to fill in
