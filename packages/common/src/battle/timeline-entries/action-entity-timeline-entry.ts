import { ActionEntity } from "../../action-entities/index.js";
import { TaggedActionEntityActionUserEntityId } from "../../action-user-context/tagged-action-user-id.js";
import { AdventuringParty } from "../../adventuring-party/index.js";
import { BattleTimelineEntry } from "./index.js";

export class ActionEntityBattleTimelineEntry extends BattleTimelineEntry<
  TaggedActionEntityActionUserEntityId,
  ActionEntity
> {
  getActionUserId() {
    return this._taggedActionUserId.actionEntityId;
  }

  requireActionUser(party: AdventuringParty) {
    return party.actionEntityManager.requireActionEntityById(
      this._taggedActionUserId.actionEntityId
    );
  }

  isStale(party: AdventuringParty) {
    const { actionEntityManager } = party;
    const entityOption = actionEntityManager.getActionEntityOption(
      this._taggedActionUserId.actionEntityId
    );
    return entityOption === undefined;
  }
}
