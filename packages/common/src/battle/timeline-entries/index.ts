import { IActionUser } from "../../action-user-context/action-user.js";
import { TaggedActionUserEntityId } from "../../action-user-context/tagged-action-user-id.js";
import { AdventuringParty } from "../../adventuring-party/index.js";
import { EntityId } from "../../aliases.js";
import { CombatActionName } from "../../combat/combat-actions/combat-action-names.js";
import { Serializable } from "../../serialization/index.js";
import { ITurnDelayPolicy } from "../turn-delay-policies/index.js";

export interface BattleTimelineEntryIdentifier {
  forActionUserId: EntityId;
  index: number;
}

export interface BattleTimelineEntryTiming {
  turnDelayRate: number;
  timeOfNextTurn: number;
}

export interface BattleTimelineEntryUpdate {
  identifier: BattleTimelineEntryIdentifier;
  timing: BattleTimelineEntryTiming;
}

export abstract class BattleTimelineEntry<
  TaggedId extends TaggedActionUserEntityId,
  ActionUser extends IActionUser,
> implements Serializable {
  private _timeOfNextTurn: number;
  private _turnDelayRate: number;

  constructor(
    public readonly taggedActionUserId: TaggedId,
    protected readonly policy: ITurnDelayPolicy<ActionUser>,
    public readonly index: number,
    timing: BattleTimelineEntryTiming
  ) {
    this._timeOfNextTurn = timing.timeOfNextTurn;
    this._turnDelayRate = timing.turnDelayRate;
  }

  toSerialized() {
    return {
      taggedActionUserId: this.taggedActionUserId,
      index: this.index,
      timing: { timeOfNextTurn: this._timeOfNextTurn, turnDelayRate: this._turnDelayRate },
    };
  }

  get identifier(): BattleTimelineEntryIdentifier {
    return { index: this.index, forActionUserId: this.actionUserId };
  }

  abstract actionUserId: EntityId;
  abstract requireActionUser(party: AdventuringParty): ActionUser;
  abstract isStale(party: AdventuringParty): boolean;

  isIdentifiedBy(identifier: BattleTimelineEntryIdentifier) {
    return (
      this.identifier.index === identifier.index &&
      this.identifier.forActionUserId === identifier.forActionUserId
    );
  }

  get actionUserType() {
    return this.taggedActionUserId.type;
  }

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
    return this.policy.computeBaseTurnDelay(this.requireActionUser(party));
  }

  computeDelayAddedOnTurnEnd(party: AdventuringParty, actionName: CombatActionName) {
    return this.policy.computeDelayOnTurnEnded(this.requireActionUser(party), actionName);
  }

  computeForecastTurnCountLimitOption(party: AdventuringParty) {
    return this.policy.computeForecastTurnCountLimitOption(this.requireActionUser(party));
  }

  get timeOfNextTurn() {
    return this._timeOfNextTurn;
  }

  get turnDelayRate() {
    return this._turnDelayRate;
  }
}
