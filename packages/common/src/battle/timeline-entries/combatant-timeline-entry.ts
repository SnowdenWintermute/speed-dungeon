import { TaggedCombatantActionUserCombatantId } from "../../action-user-context/tagged-action-user-id.js";
import { AdventuringParty } from "../../adventuring-party/index.js";
import { Combatant } from "../../combatants/index.js";
import { BattleTimelineEntry } from "./index.js";

export class CombatantBattleTimelineEntry extends BattleTimelineEntry<
  TaggedCombatantActionUserCombatantId,
  Combatant
> {
  getActionUserId() {
    return this._taggedActionUserId.combatantId;
  }

  requireActionUser(party: AdventuringParty) {
    return party.combatantManager.requireCombatantById(this._taggedActionUserId.combatantId);
  }

  isStale(party: AdventuringParty) {
    const combatantOption = party.combatantManager.getCombatantOption(
      this._taggedActionUserId.combatantId
    );
    const combatantMissing = combatantOption === undefined;
    return combatantMissing || combatantOption.combatantProperties.isDead();
  }
}
