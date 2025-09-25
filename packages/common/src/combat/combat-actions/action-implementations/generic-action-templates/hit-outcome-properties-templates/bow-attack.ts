import { CombatAttribute } from "../../../../../combatants/attributes/index.js";
import { HoldableSlotType } from "../../../../../items/equipment/slots.js";
import {
  CombatActionHitOutcomeProperties,
  CombatActionResource,
} from "../../../combat-action-hit-outcome-properties.js";
import { getAttackResourceChangeProperties } from "../../attack/get-attack-resource-change-properties.js";
import { RANGED_ACTION_HIT_OUTCOME_PROPERTIES } from "./ranged-action.js";

export const BOW_ATTACK_HIT_OUTCOME_PROPERTIES: CombatActionHitOutcomeProperties = {
  ...RANGED_ACTION_HIT_OUTCOME_PROPERTIES,
  addsPropertiesFromHoldableSlot: HoldableSlotType.MainHand,
  resourceChangePropertiesGetters: {
    [CombatActionResource.HitPoints]: (
      user,
      hitOutcomeProperties,
      actionLevel,
      primaryTarget,
      actionEntityOption
    ) => {
      const hpChangeProperties = getAttackResourceChangeProperties(
        user,
        hitOutcomeProperties,
        actionLevel,
        primaryTarget,
        CombatAttribute.Dexterity,
        // allow unusable weapons because it may be the case that the bow breaks
        // but the projectile has yet to caluclate it's hit, and it should still consider
        // the bow it was fired from
        // it should never add weapon properties from an initially broken weapon because the projectile would not
        // be allowed to be fired from a broken weapon
        { usableWeaponsOnly: false }
      );

      const actionEntityResourceChangeSourceOption =
        actionEntityOption?.actionEntityProperties.actionOriginData?.resourceChangeSource;

      if (actionEntityResourceChangeSourceOption) {
        const toModify = hpChangeProperties.resourceChangeSource;
        const { category, elementOption } = actionEntityResourceChangeSourceOption;
        if (category !== undefined) toModify.category = category;
        if (elementOption !== undefined) toModify.elementOption = elementOption;
      }

      if (hpChangeProperties instanceof Error) return hpChangeProperties;

      return hpChangeProperties;
    },
  },
};
