import { HoldableSlotType } from "../../../../../items/equipment/slots.js";
import { CombatActionHitOutcomeProperties } from "../../../combat-action-hit-outcome-properties.js";
import { ARROW_RESOURCE_CHANGE_CALCULATORS } from "../resource-change-calculation-templates/arrow.js";
import { RANGED_ACTION_HIT_OUTCOME_PROPERTIES } from "./ranged-action.js";

export const BOW_ATTACK_HIT_OUTCOME_PROPERTIES: CombatActionHitOutcomeProperties = {
  ...RANGED_ACTION_HIT_OUTCOME_PROPERTIES,
  addsPropertiesFromHoldableSlot: HoldableSlotType.MainHand,
  resourceChangePropertiesGetters: ARROW_RESOURCE_CHANGE_CALCULATORS,
};
