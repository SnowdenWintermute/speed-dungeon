import { IActionUser } from "../action-user-context/action-user.js";
import {
  ActionUserType,
  TaggedActionUserEntityId,
} from "../action-user-context/tagged-action-user-id.js";
import { AdventuringParty } from "../adventuring-party/index.js";
import { EntityId } from "../aliases.js";
import { CombatActionName } from "../combat/combat-actions/combat-action-names.js";
import { RandomNumberGenerator } from "../utility-classes/randomizers.js";
import { invariant } from "../utils/index.js";
import { AnyBattleTimelineEntry } from "./timeline-entries/any-battle-timeline-entry.js";
import {
  BattleTimelineEntryIdentifier,
  BattleTimelineEntryTiming,
} from "./timeline-entries/index.js";
import { BattleTimelineEntryFactory } from "./timeline-entries/timeline-entry-factory.js";
import { COMBATANT_TURN_DELAY_POLICY } from "./turn-delay-policies/combatant-turn-delay-policy.js";
import { COMBATANT_CONDITION_TURN_DELAY_POLICY } from "./turn-delay-policies/condition-turn-delay-policy.js";
import { ITurnDelayPolicy } from "./turn-delay-policies/index.js";

const actionUserTypeTurnOrderTieBreakValues: Record<ActionUserType, number> = {
  [ActionUserType.Combatant]: 0,
  [ActionUserType.Condition]: 1,
  [ActionUserType.ActionEntity]: 2,
};

export class BattleTimeline {
  private entries: AnyBattleTimelineEntry[] = [];
  private entryCurrentlyTakingTurnId: BattleTimelineEntryIdentifier | undefined;
  private _now: number = 0;

  private entryCurrentlyTakingTurn(): AnyBattleTimelineEntry {
    throw new Error("not implemented");
  }

  get now() {
    return this._now;
  }

  private sort() {
    this.entries.sort(
      (a, b) =>
        a.timeOfNextTurn - b.timeOfNextTurn ||
        actionUserTypeTurnOrderTieBreakValues[a.getActionUserType()] -
          actionUserTypeTurnOrderTieBreakValues[b.getActionUserType()] ||
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

  startTurn() {
    // marks the appropriate BattleTimelineEntry as currently taking turn, called at the start of processCombatAction()
    this._now = this.requireFastestTimelineEntry().timeOfNextTurn;
  }

  computeDelayOnTurnEnded(actionName: CombatActionName) {
    // get currentlyTakingTurn
    // determine delay for that BattleTimelineEntry
    // return it
  }

  endCurrentTurn(timing: BattleTimelineEntryTiming) {
    // - add delay to the BattleTimelineEntry marked as currently taking
    //   turn if it still exists (hasn't been removed by stale sweep),
    // - clear currentlyTakingTurn
    // - call computeRescaledTiming on each BattleTimelineEntry
    // - set new timings on all BattleTimelineEntry
    // - update the forecast
    // - tell the client
  }

  register(
    taggedActionUserId: TaggedActionUserEntityId,
    timelineEntryTimings: BattleTimelineEntryTiming[]
  ) {
    this.entries.push(
      ...BattleTimelineEntryFactory.create(taggedActionUserId, timelineEntryTimings)
    );
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

  registerAllMovingActionUsers(party: AdventuringParty, initiativeRng: RandomNumberGenerator) {
    const combatants = party.combatantManager.iterateAllCombatants();
    for (const combatant of combatants) {
      const timings = this.computeEntryTimingsOnRegistered(
        COMBATANT_TURN_DELAY_POLICY,
        combatant,
        initiativeRng
      );
      this.register(combatant.getTaggedId(), timings);
    }

    const conditions = party.combatantManager.getAllTickableConditions();
    for (const condition of conditions) {
      const timings = this.computeEntryTimingsOnRegistered(
        COMBATANT_CONDITION_TURN_DELAY_POLICY,
        condition,
        initiativeRng
      );
      this.register(condition.getTaggedId(), timings);
    }
  }

  unregister(actionUserId: EntityId) {
    // called for explicit removals, and by the stale sweep
  }

  forecast() {
    // :BattleTimelineForecast
  }
}
