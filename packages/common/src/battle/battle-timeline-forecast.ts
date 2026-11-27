import { ActionUserType } from "../action-user-context/tagged-action-user-id.js";
import { AdventuringParty } from "../adventuring-party/index.js";
import {
  BATTLE_TIMELINE_FORECAST_COMBATANT_TURN_COUNT,
  BattleTimelineForecastEntry,
  BattleTimelineTurnOrder,
  ITurnOrderSortable,
} from "./battle-timeline-turn-order.js";
import { AnyBattleTimelineEntry } from "./timeline-entries/any-battle-timeline-entry.js";
import { BattleTimelineEntryIdentifier } from "./timeline-entries/index.js";

class SimulatedTimelineEntry implements ITurnOrderSortable {
  timeOfNextTurn: number;
  turnsRemainingOption: number | null;
  constructor(
    private realEntry: AnyBattleTimelineEntry,
    party: AdventuringParty
  ) {
    this.timeOfNextTurn = realEntry.timeOfNextTurn;
    this.turnsRemainingOption = realEntry.computeForecastTurnCountLimitOption(party);
  }

  get turnDelayRate() {
    return this.realEntry.turnDelayRate;
  }

  get index() {
    return this.realEntry.index;
  }

  get actionUserType() {
    return this.realEntry.actionUserType;
  }

  get actionUserId() {
    return this.realEntry.actionUserId;
  }

  get identifier(): BattleTimelineEntryIdentifier {
    return this.realEntry.identifier;
  }

  get taggedActionUserId() {
    return this.realEntry.taggedActionUserId;
  }
}

export class BattleTimelineForecaster {
  static forecast(entries: AnyBattleTimelineEntry[], party: AdventuringParty) {
    const simulated = entries.map((entry) => new SimulatedTimelineEntry(entry, party));

    const result: BattleTimelineForecastEntry[] = [];
    let combatantTurnCount = 0;

    while (combatantTurnCount < BATTLE_TIMELINE_FORECAST_COMBATANT_TURN_COUNT) {
      const next = simulated
        .filter((s) => s.turnsRemainingOption === null || s.turnsRemainingOption > 0)
        .sort((a, b) => BattleTimelineTurnOrder.compare(a, b))[0];

      if (next === undefined) {
        break;
      }

      result.push({
        identifier: next.identifier,
        taggedActionUserId: next.taggedActionUserId,
        timeOfTurn: next.timeOfNextTurn,
      });

      if (next.actionUserType === ActionUserType.Combatant) {
        combatantTurnCount += 1;
      }

      next.timeOfNextTurn += next.turnDelayRate;
      if (next.turnsRemainingOption !== null) {
        next.turnsRemainingOption -= 1;
      }
    }
    return result;
  }
}
