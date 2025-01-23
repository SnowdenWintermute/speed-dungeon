import cloneDeep from "lodash.clonedeep";
import { SpeedDungeonPlayer } from "../../game/index.js";
import { CombatActionTarget, CombatActionTargetType } from "./combat-action-targets.js";
import {
  FriendOrFoe,
  TargetingScheme,
} from "../combat-actions/targeting-schemes-and-categories.js";
import { CombatActionComponent } from "../combat-actions/index.js";

export default function setAndReturnUpdatedTargetPreferences(
  player: SpeedDungeonPlayer,
  combatAction: CombatActionComponent,
  newTargets: CombatActionTarget,
  allyIdsOption: null | string[],
  opponentIdsOption: null | string[]
) {
  const newPreferences = cloneDeep(player.targetPreferences);
  switch (newTargets.type) {
    case CombatActionTargetType.Single:
      const { targetId } = newTargets;
      const isOpponentId = !!opponentIdsOption?.includes(targetId);
      if (isOpponentId) {
        newPreferences.hostileSingle = targetId;
        newPreferences.category = FriendOrFoe.Hostile;
      } else if (allyIdsOption?.includes(targetId)) {
        newPreferences.friendlySingle = targetId;
        newPreferences.category = FriendOrFoe.Friendly;
      }
      break;
    case CombatActionTargetType.Group:
      const category = newTargets.friendOrFoe;
      if (combatAction.targetingSchemes.length > 1) {
        newPreferences.category = category;
        newPreferences.targetingSchemePreference = TargetingScheme.Area;
      } else {
        // if they had no choice in targeting schemes, don't update their preference
      }
      break;
    case CombatActionTargetType.All:
      if (combatAction.targetingSchemes.length > 1)
        newPreferences.targetingSchemePreference = TargetingScheme.All;
  }

  player.targetPreferences = newPreferences;

  return newPreferences;
}
