import { ActionEntity } from "../../action-entities/index.js";
import { TaggedActionEntityActionUserEntityId } from "../../action-user-context/tagged-action-user-id.js";
import { AdventuringParty } from "../../adventuring-party/index.js";
import { BattleTimelineEntry } from "./index.js";

export class ActionEntityBattleTimelineEntry extends BattleTimelineEntry<
  TaggedActionEntityActionUserEntityId,
  ActionEntity
> {
  getActionUserId() {
    return this.taggedActionUserId.actionEntityId;
  }

  requireActionUser(party: AdventuringParty) {
    return party.actionEntityManager.requireActionEntityById(
      this.taggedActionUserId.actionEntityId
    );
  }
}
