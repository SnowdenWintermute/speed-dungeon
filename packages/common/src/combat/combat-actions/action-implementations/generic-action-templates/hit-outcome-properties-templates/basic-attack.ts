import { BASE_CRIT_CHANCE, BASE_CRIT_MULTIPLIER } from "../../../../../app-consts.js";
import { CombatAttribute } from "../../../../../combatants/attributes/index.js";
import { getStandardThreatChangesOnHitOutcomes } from "../../../../../combatants/threat-manager/get-standard-threat-changes-on-hit-outcomes.js";
import { ActionAccuracyType } from "../../../combat-action-accuracy.js";
import { CombatActionHitOutcomeProperties } from "../../../combat-action-hit-outcome-properties.js";

export const BASIC_ATTACK_HIT_OUTCOME_PROPERTIES: CombatActionHitOutcomeProperties = {
  accuracyModifier: 1,
  critChanceModifier: 1,
  resourceChangeValuesModifier: 1,
  addsPropertiesFromHoldableSlot: null,
  getUnmodifiedAccuracy: (user) => {
    const userCombatAttributes = user.getTotalAttributes();
    return {
      type: ActionAccuracyType.Percentage,
      value: userCombatAttributes[CombatAttribute.Accuracy] || 0,
    };
  },
  getUnmodifiedCritChance: () => BASE_CRIT_CHANCE,
  getCritMultiplier: () => BASE_CRIT_MULTIPLIER,
  getArmorPenetration: () => 0,
  resourceChangePropertiesGetters: {},
  getAppliedConditions: () => null,
  getIsParryable: () => true,
  getIsBlockable: () => true,
  getCanTriggerCounterattack: () => true,
  getShouldAnimateTargetHitRecovery: () => true,
  getThreatChangesOnHitOutcomes: getStandardThreatChangesOnHitOutcomes,
  getOnUseTriggers: () => {
    return {};
  },
  getHitOutcomeTriggers: () => {
    return {};
  },
};
