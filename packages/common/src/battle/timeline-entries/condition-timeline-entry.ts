import { TaggedConditionActionUserConditionAndCombatantId } from "../../action-user-context/tagged-action-user-id.js";
import { AdventuringParty } from "../../adventuring-party/index.js";
import { CombatantCondition } from "../../conditions/index.js";
import { BattleTimelineEntry } from "./index.js";

export class ConditionBattleTimelineEntry extends BattleTimelineEntry<
  TaggedConditionActionUserConditionAndCombatantId,
  CombatantCondition
> {
  getActionUserId() {
    return this._taggedActionUserId.conditionId;
  }

  requireActionUser(party: AdventuringParty) {
    return party.combatantManager.requireConditionOnCombatant(
      this._taggedActionUserId.combatantId,
      this._taggedActionUserId.conditionId
    );
  }

  isStale(party: AdventuringParty) {
    const { combatantManager } = party;
    const { combatantId, conditionId } = this._taggedActionUserId;
    const combatantOption = combatantManager.getCombatantOption(combatantId);

    const combatantIsMissing = combatantOption === undefined;

    if (combatantIsMissing || combatantOption.combatantProperties.isDead()) {
      return true;
    }

    const conditionResult = combatantManager.getConditionOptionOnCombatant(
      combatantId,
      conditionId
    );

    return conditionResult === undefined;
  }
}
