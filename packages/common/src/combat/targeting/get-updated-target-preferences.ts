import cloneDeep from "lodash.clonedeep";
import { CombatActionProperties } from "../index.js";
import { CombatActionTargetPreferences } from "../../game/index.js";
import { CombatActionTarget, CombatActionTargetType } from "./combat-action-targets.js";
import {
  FriendOrFoe,
  TargetingScheme,
} from "../combat-actions/targeting-schemes-and-categories.js";

export default function getUpdatedTargetPreferences(
  currentPreferences: CombatActionTargetPreferences,
  combatActionProperties: CombatActionProperties,
  newTargets: CombatActionTarget,
  allyIdsOption: null | string[],
  opponentIdsOption: null | string[]
) {
  const newPreferences = cloneDeep(currentPreferences);
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
      if (combatActionProperties.targetingSchemes.length > 1) {
        newPreferences.category = category;
        newPreferences.targetingSchemePreference = TargetingScheme.Area;
      } else {
        // if they had no choice in targeting schemes, don't update their preference
      }
      break;
    case CombatActionTargetType.All:
      if (combatActionProperties.targetingSchemes.length > 1)
        newPreferences.targetingSchemePreference = TargetingScheme.All;
  }

  return newPreferences;
}
