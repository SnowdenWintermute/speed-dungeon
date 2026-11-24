import { TaggedConditionActionUserConditionAndCombatantId } from "../../action-user-context/tagged-action-user-id.js";
import { AdventuringParty } from "../../adventuring-party/index.js";
import { CombatantCondition } from "../../conditions/index.js";
import { BattleTimelineEntry } from "./index.js";

export class ConditionBattleTimelineEntry extends BattleTimelineEntry<
  TaggedConditionActionUserConditionAndCombatantId,
  CombatantCondition
> {
  getActionUserId() {
    return this.taggedActionUserId.conditionId;
  }

  requireActionUser(party: AdventuringParty) {
    return party.combatantManager.requireConditionOnCombatant(
      this.taggedActionUserId.combatantId,
      this.taggedActionUserId.conditionId
    );
  }
}
