import { makeAutoObservable } from "mobx";
import { IActionUser } from "../action-user-context/action-user.js";
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
  BattleTimelineRegistration,
} from "./timeline-entries/index.js";
import { BattleTimelineEntryFactory } from "./timeline-entries/timeline-entry-factory.js";
import { COMBATANT_TURN_DELAY_POLICY } from "./turn-delay-policies/combatant-turn-delay-policy.js";
import { COMBATANT_CONDITION_TURN_DELAY_POLICY } from "./turn-delay-policies/condition-turn-delay-policy.js";
import { ITurnDelayPolicy } from "./turn-delay-policies/index.js";
import { CombatantCondition } from "../conditions/index.js";
import { Combatant } from "../combatants/index.js";
import { CombatantTraitType } from "../combatants/combatant-traits/trait-types.js";

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

  requireFastestTimelineEntry() {
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

  registerOne(registration: BattleTimelineRegistration) {
    const { taggedActionUserId, timings } = registration;
    this.entries.push(...BattleTimelineEntryFactory.createEntries(taggedActionUserId, timings));
    this.sort();
  }

  registerMany(registrations: BattleTimelineRegistration[]) {
    for (const registration of registrations) {
      this.registerOne(registration);
    }
  }

  private computeEntryTimingsOnRegistered<ActionUser extends IActionUser>(
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

  private computeConditionTimingsOnRegistered(
    condition: CombatantCondition,
    initiativeRng: RandomNumberGenerator
  ) {
    return this.computeEntryTimingsOnRegistered(
      COMBATANT_CONDITION_TURN_DELAY_POLICY,
      condition,
      initiativeRng
    );
  }

  private computeCombatantTimingOnRegistered(
    combatant: Combatant,
    initiativeRng: RandomNumberGenerator
  ) {
    return this.computeEntryTimingsOnRegistered(
      COMBATANT_TURN_DELAY_POLICY,
      combatant,
      initiativeRng
    );
  }

  computeRegistrationForCondition(
    condition: CombatantCondition,
    initiativeRng: RandomNumberGenerator
  ) {
    return {
      taggedActionUserId: condition.getTaggedId(),
      timings: this.computeConditionTimingsOnRegistered(condition, initiativeRng),
    };
  }

  computeRegistrationsForCombatant(combatant: Combatant, initiativeRng: RandomNumberGenerator) {
    const isPassive = combatant
      .getCombatantProperties()
      .abilityProperties.getTraitProperties()
      .hasTraitType(CombatantTraitType.Passive);

    const registrations: BattleTimelineRegistration[] = [];

    if (!isPassive) {
      registrations.push({
        taggedActionUserId: combatant.getTaggedId(),
        timings: this.computeCombatantTimingOnRegistered(combatant, initiativeRng),
      });
    }

    combatant.combatantProperties.conditionManager.getConditions().forEach((condition) => {
      registrations.push({
        taggedActionUserId: condition.getTaggedId(),
        timings: this.computeConditionTimingsOnRegistered(condition, initiativeRng),
      });
    });

    return registrations;
  }

  registerAllCombatantsOnBattleStart(initiativeRng: RandomNumberGenerator) {
    const combatants = this.party.combatantManager.iterateAllCombatants();
    for (const combatant of combatants) {
      const registrations = this.computeRegistrationsForCombatant(combatant, initiativeRng);
      this.registerMany(registrations);
    }
  }

  refreshForecast() {
    this._forecast = BattleTimelineForecaster.forecast(this.entries, this.party);
  }

  get forecast() {
    return this._forecast;
  }
}
