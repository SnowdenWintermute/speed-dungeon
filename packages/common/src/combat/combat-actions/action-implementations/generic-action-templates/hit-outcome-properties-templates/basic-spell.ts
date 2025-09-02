import { ActionAccuracyType } from "../../../combat-action-accuracy.js";
import { CombatActionHitOutcomeProperties } from "../../../combat-action-hit-outcome-properties.js";
import { BASIC_ATTACK_HIT_OUTCOME_PROPERTIES } from "./basic-attack.js";

export const BASIC_SPELL_HIT_OUTCOME_PROPERTIES: CombatActionHitOutcomeProperties = {
  ...BASIC_ATTACK_HIT_OUTCOME_PROPERTIES,
  getUnmodifiedAccuracy: (user) => {
    return { type: ActionAccuracyType.Unavoidable };
  },
  getIsParryable: () => false,
  getCanTriggerCounterattack: () => false,
};
