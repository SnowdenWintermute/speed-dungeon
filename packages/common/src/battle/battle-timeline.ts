import { IActionUser } from "../action-user-context/action-user.js";
import { TaggedActionUserEntityId } from "../action-user-context/tagged-action-user-id.js";
import { AdventuringParty } from "../adventuring-party/index.js";
import { ACTION_USER_TYPE_TURN_ORDER_TIE_BREAK_VALUES } from "../app-consts.js";
import { CombatActionName } from "../combat/combat-actions/combat-action-names.js";
import { Serializable, SerializedOf } from "../serialization/index.js";
import { RandomNumberGenerator } from "../utility-classes/randomizers.js";
import { invariant } from "../utils/index.js";
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

export class BattleTimeline implements Serializable {
  constructor(
    private _party: AdventuringParty,
    private entries: AnyBattleTimelineEntry[] = [],
    private _now: number = 0,
    private _entryCurrentlyTakingTurnId?: BattleTimelineEntryIdentifier
  ) {}

  toSerialized() {
    return {
      entries: this.entries,
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
      serialized.entries,
      serialized._now,
      serialized._entryCurrentlyTakingTurnId
    );
  }

  private get party() {
    invariant(this._party !== undefined, "not initialized");
    return this._party;
  }

  get now() {
    return this._now;
  }

  private sort() {
    this.entries.sort(
      (a, b) =>
        a.timeOfNextTurn - b.timeOfNextTurn ||
        ACTION_USER_TYPE_TURN_ORDER_TIE_BREAK_VALUES[a.getActionUserType()] -
          ACTION_USER_TYPE_TURN_ORDER_TIE_BREAK_VALUES[b.getActionUserType()] ||
        a.turnDelayRate - b.turnDelayRate ||
        a.getActionUserId().localeCompare(b.getActionUserId()) ||
        a.index - b.index
    );
  }

  private requireFastestTimelineEntry() {
    this.sort();
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
  }

  computeStaleEntries(party: AdventuringParty) {
    const staleEntryIds: BattleTimelineEntryIdentifier[] = [];
    for (const entry of this.entries) {
      if (entry.isStale(party)) {
        staleEntryIds.push(entry.identifier);
      }
    }

    return staleEntryIds;
  }

  removeEntries(toRemove: BattleTimelineEntryIdentifier[]) {
    this.entries = this.entries.filter(
      (entry) => !toRemove.some((identifier) => entry.isIdentifiedBy(identifier))
    );
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

  register(
    taggedActionUserId: TaggedActionUserEntityId,
    timelineEntryTimings: BattleTimelineEntryTiming[]
  ) {
    this.entries.push(
      ...BattleTimelineEntryFactory.create(taggedActionUserId, timelineEntryTimings)
    );
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

  forecast() {
    // :BattleTimelineForecast
  }
}
