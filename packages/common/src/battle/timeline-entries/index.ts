import { IActionUser } from "../../action-user-context/action-user.js";
import { TaggedActionUserEntityId } from "../../action-user-context/tagged-action-user-id.js";
import { AdventuringParty } from "../../adventuring-party/index.js";
import { EntityId } from "../../aliases.js";
import { ITurnDelayPolicy } from "../turn-delay-policy.js";

export interface BattleTimelineEntryIdentifier {
  forActionUserId: EntityId;
  index: number;
}

export interface BattleTimelineEntryTiming {
  turnDelayRate: number;
  timeOfNextTurn: number;
}

export abstract class BattleTimelineEntry<
  TaggedId extends TaggedActionUserEntityId,
  ActionUser extends IActionUser,
> {
  private _timeOfNextTurn: number;
  private _turnDelayRate: number;

  constructor(
    protected readonly taggedActionUserId: TaggedId,
    protected readonly policy: ITurnDelayPolicy<ActionUser>,
    public readonly index: number,
    timing: BattleTimelineEntryTiming
  ) {
    this._timeOfNextTurn = timing.timeOfNextTurn;
    this._turnDelayRate = timing.turnDelayRate;
  }

  abstract getActionUserId(): EntityId;
  abstract requireActionUser(party: AdventuringParty): ActionUser;

  computeRescaledTiming(newTurnDelayRate: number, now: number): BattleTimelineEntryTiming {
    const remaining = this._timeOfNextTurn - now;
    return {
      timeOfNextTurn: now + Math.round((remaining * newTurnDelayRate) / this._turnDelayRate),
      turnDelayRate: newTurnDelayRate,
    };
  }

  setTiming(timing: BattleTimelineEntryTiming) {
    this._timeOfNextTurn = timing.timeOfNextTurn;
    this._turnDelayRate = timing.turnDelayRate;
  }

  computeCurrentTurnDelayRate(party: AdventuringParty) {
    return this.policy.computeTurnDelay(this.requireActionUser(party));
  }

  get timeOfNextTurn() {
    return this._timeOfNextTurn;
  }

  get turnDelayRate() {
    return this._turnDelayRate;
  }
}
