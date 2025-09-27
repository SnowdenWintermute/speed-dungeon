import { HoldableSlotType } from "../../../../../items/equipment/slots.js";
import {
  CombatActionHitOutcomeProperties,
  CombatActionResource,
} from "../../../combat-action-hit-outcome-properties.js";
import { getBowAttackHitOutcomeProperties } from "../step-config-templates/bow-skill.js";
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
      const resourceChangeProperties = getBowAttackHitOutcomeProperties(
        user,
        hitOutcomeProperties,
        actionLevel,
        primaryTarget
      );

      const hpChangeProperties = resourceChangeProperties[CombatActionResource.HitPoints];

      if (hpChangeProperties === undefined)
        throw new Error("expected hit points resource change to be configured");

      return hpChangeProperties;
    },
  },
};
