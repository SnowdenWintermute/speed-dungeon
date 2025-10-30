import { EntityId } from "../primatives/index.js";
import {
  FriendOrFoe,
  TargetingScheme,
} from "../combat/combat-actions/targeting-schemes-and-categories.js";
import { COMBAT_ACTIONS, CombatActionTarget, CombatActionTargetType } from "../combat/index.js";
import { ActionAndRank } from "../action-user-context/action-user-targeting-properties.js";
import { plainToInstance } from "class-transformer";

export class SpeedDungeonPlayer {
  partyName: null | string = null;
  characterIds: string[] = [];
  targetPreferences: CombatActionTargetPreferences = new CombatActionTargetPreferences();
  constructor(public username: string) {}

  static deserialize(player: SpeedDungeonPlayer) {
    player.targetPreferences = CombatActionTargetPreferences.getDeserialized(
      player.targetPreferences
    );
  }
}

export class CombatActionTargetPreferences {
  friendlySingle: null | EntityId = null;
  hostileSingle: null | EntityId = null;
  category: null | FriendOrFoe = null;
  targetingSchemePreference: TargetingScheme = TargetingScheme.Single;
  constructor() {}

  static getDeserialized(targetPreferences: CombatActionTargetPreferences) {
    return plainToInstance(CombatActionTargetPreferences, targetPreferences);
  }

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
