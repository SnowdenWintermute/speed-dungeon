import { TurnOrderManager, TurnTracker } from "./index.js";
import { AdventuringParty } from "../../adventuring-party/index.js";
import { BASE_ACTION_DELAY_MULTIPLIER } from "./consts.js";
import { SpeedDungeonGame } from "../../game/index.js";

export interface ITurnScheduler {
  timeOfNextMove: number;
  accumulatedDelay: number; // when they take their turn, add to this
  getSpeed: (party: AdventuringParty) => number;
  getTiebreakerId: () => string;
  isStale: (party: AdventuringParty) => boolean;
  isMatch: (otherScheduler: ITurnScheduler) => boolean;
  reset: (party: AdventuringParty) => void;
  createTurnTrackerOption: (game: SpeedDungeonGame, party: AdventuringParty) => null | TurnTracker;
}

export abstract class TurnScheduler implements ITurnScheduler {
  timeOfNextMove = 0;
  accumulatedDelay = 0;
  protected predictedConsumedStacks = 0;

  abstract getSpeed(party: AdventuringParty): number;
  abstract getTiebreakerId(): string;
  abstract isStale(party: AdventuringParty): boolean;
  abstract isMatch(otherScheduler: ITurnScheduler): boolean;
  abstract createTurnTrackerOption(
    game: SpeedDungeonGame,
    party: AdventuringParty
  ): null | TurnTracker;

  reset(party: AdventuringParty) {
    // take into account any delay they've accumulated from taking actions in this battle
    this.timeOfNextMove = this.accumulatedDelay;
    const initialDelay = TurnOrderManager.getActionDelayCost(
      this.getSpeed(party),
      BASE_ACTION_DELAY_MULTIPLIER
    );
    // start with an initial delay
    this.timeOfNextMove += initialDelay;

    // this is how we can know to only show turns of a condition/action entity
    // until their stacks/turns would have been consumed
    this.predictedConsumedStacks = 0;
  }
}
