import { makeAutoObservable } from "mobx";
import { IActionUser } from "../action-user-context/action-user.js";
import { TaggedActionUserEntityId } from "../action-user-context/tagged-action-user-id.js";
import { AdventuringParty } from "../adventuring-party/index.js";
import { CombatActionName } from "../combat/combat-actions/combat-action-names.js";
import { ReactiveNode, Serializable, SerializedOf } from "../serialization/index.js";
import { RandomNumberGenerator } from "../utility-classes/randomizers.js";
import { invariant } from "../utils/index.js";
import { BattleTimelineForecaster } from "./battle-timeline-forecast.js";
import {
  BattleTimelineForecastEntry,
  BattleTimelineTurnOrder,
} from "./battle-timeline-turn-order.js";
import { AnyBattleTimelineEntry } from "./timeline-entries/any-battle-timeline-entry.js";
import {
  BattleTimelineEntryIdentifier,
  BattleTimelineEntryTiming,
  BattleTimelineEntryUpdate,
} from "./timeline-entries/index.js";
import { BattleTimelineEntryFactory } from "./timeline-entries/timeline-entry-factory.js";
import { COMBATANT_TURN_DELAY_POLICY } from "./turn-delay-policies/combatant-turn-delay-policy.js";
import { COMBATANT_CONDITION_TURN_DELAY_POLICY } from "./turn-delay-policies/condition-turn-delay-policy.js";
import { ITurnDelayPolicy } from "./turn-delay-policies/index.js";

export class BattleTimeline implements Serializable, ReactiveNode {
  private _forecast: BattleTimelineForecastEntry[] = [];

  constructor(
    private party: AdventuringParty,
    private entries: AnyBattleTimelineEntry[] = [],
    private _now: number = 0,
    private _entryCurrentlyTakingTurnId?: BattleTimelineEntryIdentifier
  ) {}

  makeObservable() {
    makeAutoObservable(this);
  }

  toSerialized() {
    return {
      entries: this.entries.map((value) => value.toSerialized()),
      _entryCurrentlyTakingTurnId: this._entryCurrentlyTakingTurnId,
      _now: this._now,
    };
  }

  static fromSerialized(
    serialized: SerializedOf<BattleTimeline>,
    party: AdventuringParty
  ): BattleTimeline {
    return new BattleTimeline(
      party,
      serialized.entries.map((v) => BattleTimelineEntryFactory.fromSerialized(v)),
      serialized._now,
      serialized._entryCurrentlyTakingTurnId
    );
  }

  get now() {
    return this._now;
  }

  private sort() {
    this.entries.sort((a, b) => BattleTimelineTurnOrder.compare(a, b));
  }

  private requireFastestTimelineEntry() {
    const fastest = this.entries[0];
    invariant(fastest !== undefined, "no timeline entries");
    return fastest;
  }

  private getEntryOption(identifier: BattleTimelineEntryIdentifier) {
    return this.entries.find((entry) => entry.isIdentifiedBy(identifier));
  }

  // called at the start of processCombatAction()
  startTurn() {
    const fastestTimelineEntry = this.requireFastestTimelineEntry();
    this._now = fastestTimelineEntry.timeOfNextTurn;
    this._entryCurrentlyTakingTurnId = fastestTimelineEntry.identifier;
  }

  applyUpdates(updates: BattleTimelineEntryUpdate[]) {
    for (const update of updates) {
      const entryOption = this.getEntryOption(update.identifier);
      if (entryOption !== undefined) {
        entryOption.setTiming(update.timing);
      }
    }

    this.sort();
  }

  computeStaleEntries() {
    const staleEntryIds: BattleTimelineEntryIdentifier[] = [];
    for (const entry of this.entries) {
      if (entry.isStale(this.party)) {
        staleEntryIds.push(entry.identifier);
      }
    }

    return staleEntryIds;
  }

  removeEntries(toRemove: BattleTimelineEntryIdentifier[]) {
    this.entries = this.entries.filter(
      (entry) => !toRemove.some((identifier) => entry.isIdentifiedBy(identifier))
    );
    this.sort();
  }

  computeTurnEndUpdates(actionName: CombatActionName) {
    invariant(this._entryCurrentlyTakingTurnId !== undefined, "no entry marked as taking turn");
    const updates: BattleTimelineEntryUpdate[] = [];

    const currentTurnTakerOption = this.getEntryOption(this._entryCurrentlyTakingTurnId);

    for (const entry of this.entries) {
      const turnDelayRate = entry.computeCurrentTurnDelayRate(this.party);
      if (entry === currentTurnTakerOption) {
        const timeOfNextTurn = this._now + entry.computeDelayAddedOnTurnEnd(this.party, actionName);
        updates.push({ identifier: entry.identifier, timing: { timeOfNextTurn, turnDelayRate } });
      } else {
        updates.push({
          identifier: entry.identifier,
          timing: entry.computeRescaledTiming(turnDelayRate, this._now),
        });
      }
    }
    return updates;
  }

  endCurrentTurn(updates: BattleTimelineEntryUpdate[]) {
    this.applyUpdates(updates);
    this._entryCurrentlyTakingTurnId = undefined;
  }

  get turnInProgress() {
    return this._entryCurrentlyTakingTurnId !== undefined;
  }

  register(
    taggedActionUserId: TaggedActionUserEntityId,
    timelineEntryTimings: BattleTimelineEntryTiming[]
  ) {
    this.entries.push(
      ...BattleTimelineEntryFactory.createEntries(taggedActionUserId, timelineEntryTimings)
    );
    this.sort();
  }

  computeEntryTimingsOnRegistered<ActionUser extends IActionUser>(
    policy: ITurnDelayPolicy<ActionUser>,
    actionUser: ActionUser,
    rng: RandomNumberGenerator
  ): BattleTimelineEntryTiming[] {
    const turnDelayRate = policy.computeBaseTurnDelay(actionUser);
    const timings: BattleTimelineEntryTiming[] = [];
    for (let index = 0; index < policy.computeBattleTimelineEntryCount(actionUser); index += 1) {
      const timeOfNextTurn = this._now + policy.computeDelayOnRegistered(actionUser, index, rng);
      timings.push({ timeOfNextTurn, turnDelayRate });
    }
    return timings;
  }

  registerAllMovingActionUsers(initiativeRng: RandomNumberGenerator) {
    const combatants = this.party.combatantManager.iterateAllCombatants();
    for (const combatant of combatants) {
      const timings = this.computeEntryTimingsOnRegistered(
        COMBATANT_TURN_DELAY_POLICY,
        combatant,
        initiativeRng
      );
      this.register(combatant.getTaggedId(), timings);
    }

    const conditions = this.party.combatantManager.getAllTickableConditions();
    for (const condition of conditions) {
      const timings = this.computeEntryTimingsOnRegistered(
        COMBATANT_CONDITION_TURN_DELAY_POLICY,
        condition,
        initiativeRng
      );
      this.register(condition.getTaggedId(), timings);
    }
  }

  refreshForecast() {
    this._forecast = BattleTimelineForecaster.forecast(this.entries, this.party);
  }

  get forecast() {
    return this._forecast;
  }
}
