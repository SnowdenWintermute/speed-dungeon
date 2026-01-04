import {
  FriendOrFoe,
  TargetingScheme,
} from "../combat/combat-actions/targeting-schemes-and-categories.js";
import { ActionAndRank } from "../action-user-context/action-user-targeting-properties.js";
import { plainToInstance } from "class-transformer";
import { EntityId, PartyName, Username } from "../aliases.js";
import {
  CombatActionTarget,
  CombatActionTargetType,
} from "../combat/targeting/combat-action-targets.js";
import { COMBAT_ACTIONS } from "../combat/combat-actions/action-implementations/index.js";

export class SpeedDungeonPlayer {
  partyName: null | PartyName = null;
  characterIds: string[] = [];
  targetPreferences: CombatActionTargetPreferences = new CombatActionTargetPreferences();
  constructor(public username: Username) {}

  static deserialize(player: SpeedDungeonPlayer) {
    player.targetPreferences = CombatActionTargetPreferences.getDeserialized(
      player.targetPreferences
    );
  }

  getExpectedPartyName() {
    if (this.partyName === null) {
      throw new Error(
        "Expected player to have a party when their pending game session is being created"
      );
    }

    return this.partyName;
  }

  requireHasCharacters() {
    const playerHasNoCharacters = this.characterIds.length === 0;
    if (playerHasNoCharacters) {
      throw new Error("You must control at least one character");
    }
  }
}

export class CombatActionTargetPreferences {
  friendlySingle: null | EntityId = null;
  hostileSingle: null | EntityId = null;
  category: null | FriendOrFoe = null;
  targetingSchemePreference: TargetingScheme = TargetingScheme.Single;

  static getDeserialized(targetPreferences: CombatActionTargetPreferences) {
    return plainToInstance(CombatActionTargetPreferences, targetPreferences);
  }

  clear() {
    this.friendlySingle = null;
    this.hostileSingle = null;
    this.category = null;
    this.targetingSchemePreference = TargetingScheme.Single;
  }

  getPreferredTargetsInCategory(category: FriendOrFoe): null | CombatActionTarget {
    if (this.category === null || this.targetingSchemePreference === null) {
      return null;
    }

    if (this.targetingSchemePreference === TargetingScheme.All) {
      return { type: CombatActionTargetType.All };
    }

    if (this.targetingSchemePreference === TargetingScheme.Area) {
      return { type: CombatActionTargetType.Group, friendOrFoe: this.category };
    }

    switch (category) {
      case FriendOrFoe.Friendly:
        if (this.friendlySingle === null) {
          return null;
        } else {
          return { type: CombatActionTargetType.Single, targetId: this.friendlySingle };
        }

      case FriendOrFoe.Hostile:
        if (this.hostileSingle === null) {
          return null;
        } else {
          return { type: CombatActionTargetType.Single, targetId: this.hostileSingle };
        }
      case FriendOrFoe.Neutral:
        if (this.hostileSingle !== null) {
          return { type: CombatActionTargetType.Single, targetId: this.hostileSingle };
        } else if (this.friendlySingle !== null) {
          return { type: CombatActionTargetType.Single, targetId: this.friendlySingle };
        } else {
          return null;
        }
    }
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
      case CombatActionTargetType.Single: {
        const { targetId } = newTargets;
        const isOpponentId = !!opponentIdsOption?.includes(targetId);
        if (isOpponentId) {
          this.hostileSingle = targetId;
          this.category = FriendOrFoe.Hostile;
        } else if (allyIdsOption?.includes(targetId)) {
          this.friendlySingle = targetId;
          this.category = FriendOrFoe.Friendly;
        }

        this.targetingSchemePreference = TargetingScheme.Single;
        break;
      }
      case CombatActionTargetType.Group:
        {
          const category = newTargets.friendOrFoe;
          if (targetingSchemes.length > 1) {
            this.category = category;
            this.targetingSchemePreference = TargetingScheme.Area;
          } else {
            // if they had no choice in targeting schemes, don't update their preference
          }
        }
        break;
      case CombatActionTargetType.All:
        if (targetingSchemes.length > 1) this.targetingSchemePreference = TargetingScheme.All;
        break;
      default:
        throw new Error("Not implemented yet: CombatActionTargetType.SingleAndSides case");
    }
  }
}
