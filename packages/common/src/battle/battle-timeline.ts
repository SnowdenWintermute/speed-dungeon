import { IActionUser } from "../action-user-context/action-user.js";
import { TaggedActionUserEntityId } from "../action-user-context/tagged-action-user-id.js";
import { EntityId } from "../aliases.js";
import { CombatActionName } from "../combat/combat-actions/combat-action-names.js";
import { invariant } from "../utils/index.js";
import {
  BattleTimelineEntry,
  BattleTimelineEntryIdentifier,
  BattleTimelineEntryTiming,
} from "./timeline-entries/index.js";

export class BattleTimeline {
  private entries: BattleTimelineEntry<TaggedActionUserEntityId, IActionUser>[] = [];
  private entryCurrentlyTakingTurnId: BattleTimelineEntryIdentifier | undefined;
  private _now: number = 0;

  private entryCurrentlyTakingTurn(): BattleTimelineEntry<TaggedActionUserEntityId, IActionUser> {
    throw new Error("not implemented");
  }

  get now() {
    return this._now;
  }

  private sort() {
    this.entries.sort(
      (a, b) =>
        a.timeOfNextTurn - b.timeOfNextTurn ||
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

  // run on server. server passes directly to register, and sends value to client to pass to client's register
  computeTimelineEntryTimingsOnRegistered(actionUser: IActionUser): BattleTimelineEntryTiming[] {
    throw new Error("not implemented");
  }

  register(actionUser: IActionUser, timelineEntryDelays: BattleTimelineEntryTiming[]) {
    //
  }

  unregister(actionUserId: EntityId) {
    // called for explicit removals, and by the stale sweep
  }

  forecast() {
    // :BattleTimelineForecast
  }
}
