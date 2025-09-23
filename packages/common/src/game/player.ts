import { immerable } from "immer";
import { EntityId } from "../primatives/index.js";
import {
  FriendOrFoe,
  TargetingScheme,
} from "../combat/combat-actions/targeting-schemes-and-categories.js";
import { COMBAT_ACTIONS, CombatActionTarget, CombatActionTargetType } from "../combat/index.js";
import { ActionAndRank } from "../combatant-context/action-user-targeting-properties.js";

export class SpeedDungeonPlayer {
  [immerable] = true;
  partyName: null | string = null;
  characterIds: string[] = [];
  targetPreferences: CombatActionTargetPreferences = new CombatActionTargetPreferences();
  constructor(public username: string) {}
}

export class CombatActionTargetPreferences {
  [immerable] = true;
  friendlySingle: null | EntityId = null;
  hostileSingle: null | EntityId = null;
  category: null | FriendOrFoe = null;
  targetingSchemePreference: TargetingScheme = TargetingScheme.Single;
  constructor() {}

  update(
    selectedActionAndRank: ActionAndRank,
    newTargets: CombatActionTarget,
    validTargetIdsByDisposition: Record<FriendOrFoe, EntityId[]>
  ) {
    const { actionName, rank } = selectedActionAndRank;
    const action = COMBAT_ACTIONS[actionName];
    const { targetingProperties } = action;

    const allyIdsOption = validTargetIdsByDisposition[FriendOrFoe.Friendly];
    const opponentIdsOption = validTargetIdsByDisposition[FriendOrFoe.Hostile];

    const targetingSchemes = targetingProperties.getTargetingSchemes(rank);

    switch (newTargets.type) {
      case CombatActionTargetType.Single:
        const { targetId } = newTargets;
        const isOpponentId = !!opponentIdsOption?.includes(targetId);
        if (isOpponentId) {
          this.hostileSingle = targetId;
          this.category = FriendOrFoe.Hostile;
        } else if (allyIdsOption?.includes(targetId)) {
          this.friendlySingle = targetId;
          this.category = FriendOrFoe.Friendly;
        }
        break;
      case CombatActionTargetType.Group:
        const category = newTargets.friendOrFoe;
        if (targetingSchemes.length > 1) {
          this.category = category;
          this.targetingSchemePreference = TargetingScheme.Area;
        } else {
          // if they had no choice in targeting schemes, don't update their preference
        }
        break;
      case CombatActionTargetType.All:
        if (targetingSchemes.length > 1) this.targetingSchemePreference = TargetingScheme.All;
    }
  }
}
