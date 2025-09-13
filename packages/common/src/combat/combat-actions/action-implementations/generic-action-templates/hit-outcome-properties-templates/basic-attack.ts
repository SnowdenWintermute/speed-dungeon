import { BASE_CRIT_CHANCE, BASE_CRIT_MULTIPLIER } from "../../../../../app-consts.js";
import { CombatAttribute } from "../../../../../combatants/attributes/index.js";
import { CombatantProperties } from "../../../../../combatants/index.js";
import { getStandardThreatChangesOnHitOutcomes } from "../../../../../combatants/threat-manager/get-standard-threat-changes-on-hit-outcomes.js";
import { ActionAccuracyType } from "../../../combat-action-accuracy.js";
import { CombatActionHitOutcomeProperties } from "../../../combat-action-hit-outcome-properties.js";

export const BASIC_ATTACK_HIT_OUTCOME_PROPERTIES: CombatActionHitOutcomeProperties = {
  accuracyModifier: 1,
  critChanceModifier: 1,
  resourceChangeValuesModifier: 1,
  addsPropertiesFromHoldableSlot: null,
  getUnmodifiedAccuracy: (user) => {
    const userCombatAttributes = CombatantProperties.getTotalAttributes(user);
    return {
      type: ActionAccuracyType.Percentage,
      value: userCombatAttributes[CombatAttribute.Accuracy],
    };
  },
  getUnmodifiedCritChance: (user) => BASE_CRIT_CHANCE,
  getCritMultiplier: (user) => BASE_CRIT_MULTIPLIER,
  getArmorPenetration: (user, self) => 0,
  resourceChangePropertiesGetters: {},
  getAppliedConditions: (context) => null,
  getIsParryable: (user) => true,
  getIsBlockable: (user) => true,
  getCanTriggerCounterattack: (user) => true,
  getShouldAnimateTargetHitRecovery: () => true,
  getThreatChangesOnHitOutcomes: getStandardThreatChangesOnHitOutcomes,
  getOnUseTriggers: () => {
    return {};
  },
};
