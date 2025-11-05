import { IActionUser } from "../../../../../action-user-context/action-user.js";
import { CombatantProperties } from "../../../../../combatants/combatant-properties.js";
import { CombatAttribute } from "../../../../../combatants/index.js";
import {
  CombatActionHitOutcomeProperties,
  CombatActionResource,
} from "../../../combat-action-hit-outcome-properties.js";
import { getAttackResourceChangeProperties } from "../../attack/get-attack-resource-change-properties.js";

export const ARROW_RESOURCE_CHANGE_CALCULATORS = {
  [CombatActionResource.HitPoints]: (
    user: IActionUser,
    hitOutcomeProperties: CombatActionHitOutcomeProperties,
    actionRank: number,
    primaryTargetCombatantProperties: CombatantProperties
  ) =>
    getAttackResourceChangeProperties(
      user,
      hitOutcomeProperties,
      actionRank,
      primaryTargetCombatantProperties,
      CombatAttribute.Dexterity,
      // allow unusable weapons because it may be the case that the bow breaks
      // but the projectile has yet to caluclate it's hit, and it should still consider
      // the bow it was fired from
      // it should never add weapon properties from an initially broken weapon because the projectile would not
      // be allowed to be fired from a broken weapon
      { usableWeaponsOnly: false }
    ),
};
