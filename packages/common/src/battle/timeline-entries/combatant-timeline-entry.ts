import { TaggedCombatantActionUserCombatantId } from "../../action-user-context/tagged-action-user-id.js";
import { AdventuringParty } from "../../adventuring-party/index.js";
import { Combatant } from "../../combatants/index.js";
import { BattleTimelineEntry } from "./index.js";

export class CombatantBattleTimelineEntry extends BattleTimelineEntry<
  TaggedCombatantActionUserCombatantId,
  Combatant
> {
  get actionUserId() {
    return this.taggedActionUserId.combatantId;
  }

  requireActionUser(party: AdventuringParty) {
    return party.combatantManager.requireCombatantById(this.taggedActionUserId.combatantId);
  }

  isStale(party: AdventuringParty) {
    const combatantOption = party.combatantManager.getCombatantOption(
      this.taggedActionUserId.combatantId
    );
    const combatantMissing = combatantOption === undefined;
    return combatantMissing || combatantOption.combatantProperties.isDead();
  }
}
