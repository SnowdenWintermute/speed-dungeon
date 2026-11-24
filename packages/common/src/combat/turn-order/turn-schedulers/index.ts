import { AdventuringParty } from "../../../adventuring-party/index.js";
import { SpeedDungeonGame } from "../../../game/index.js";
import { TurnTracker } from "../turn-trackers/index.js";
import { IActionUser } from "../../../action-user-context/action-user.js";
import { ActionUserType } from "../../../action-user-context/tagged-action-user-id.js";
import { TaggedTurnTrackerTrackedEntityId } from "../turn-tracker-tagged-tracked-entity-ids.js";

export interface ITurnScheduler {
  actionUserType: ActionUserType;
  timeOfNextMove: number;
  accumulatedDelay: number; // when they take their turn, add to this
  initialDelay: number;
  addDelay: (delay: number) => void;
  getTurnTakerId: () => string;
  getTaggedEntityId: () => TaggedTurnTrackerTrackedEntityId;
  requireActionUser: (party: AdventuringParty) => IActionUser;
  isStale: (party: AdventuringParty) => boolean;
  isMatch: (otherScheduler: ITurnScheduler) => boolean;
  reset: () => void;
  createTurnTrackerOption: (game: SpeedDungeonGame, party: AdventuringParty) => null | TurnTracker;
  index: number; // used to identify scheduler in case there are multiple for an action user, such as a boss monster
}

export abstract class TurnScheduler implements ITurnScheduler {
  timeOfNextMove = 0;
  accumulatedDelay = 0;

  protected predictedConsumedStacks = 0;
  constructor(
    public readonly index: number,
    public readonly initialDelay: number
  ) {}

  addDelay(delay: number) {
    this.accumulatedDelay += delay;
  }

  abstract getTaggedEntityId: () => TaggedTurnTrackerTrackedEntityId;
  abstract actionUserType: ActionUserType;
  abstract getTurnTakerId(): string;
  abstract isStale(party: AdventuringParty): boolean;
  abstract isMatch(otherScheduler: ITurnScheduler): boolean;
  abstract createTurnTrackerOption(
    game: SpeedDungeonGame,
    party: AdventuringParty
  ): null | TurnTracker;

  abstract requireActionUser(party: AdventuringParty): IActionUser;

  reset() {
    // take into account any delay they've accumulated from taking actions in this battle
    this.timeOfNextMove = this.accumulatedDelay;
    // start with an initial delay
    this.timeOfNextMove += this.initialDelay;

    // this is how we can know to only show turns of a condition/action entity
    // until their stacks/turns would have been consumed
    this.predictedConsumedStacks = 0;
  }
}
