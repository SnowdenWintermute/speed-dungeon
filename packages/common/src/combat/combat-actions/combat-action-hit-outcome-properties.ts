import { ActionResolutionStepContext } from "../../action-processing/index.js";
import { BASE_CRIT_CHANCE, BASE_CRIT_MULTIPLIER } from "../../app-consts.js";
import { CombatAttribute } from "../../combatants/attributes/index.js";
import { CombatantCondition, CombatantProperties } from "../../combatants/index.js";
import { getStandardThreatGenerationOnHitOutcomes } from "../../combatants/threat-manager/get-standard-threat-generation-on-hit-outcomes.js";
import { HoldableSlotType } from "../../items/equipment/slots.js";
import { EntityId, NormalizedPercentage, Percentage } from "../../primatives/index.js";
import { CombatActionHitOutcomes, ThreatChanges } from "../action-results/index.js";
import {
  getStandardActionArmorPenetration,
  getStandardActionCritChance,
  getStandardActionCritMultiplier,
} from "./action-calculation-utils/standard-action-calculations.js";
import { getAttackResourceChangeProperties } from "./action-implementations/attack/get-attack-hp-change-properties.js";
import { ActionAccuracy, ActionAccuracyType } from "./combat-action-accuracy.js";
import { CombatActionResourceChangeProperties } from "./combat-action-resource-change-properties.js";

export interface CombatActionHitOutcomeProperties {
  accuracyModifier: NormalizedPercentage;
  // used for determining melee attack animation types at start of action
  // @TODO - could be used for generically adding weapon damage and kinetic types to hit outcomes
  addsPropertiesFromHoldableSlot: null | HoldableSlotType;
  getUnmodifiedAccuracy: (user: CombatantProperties) => ActionAccuracy;
  getCritChance: (user: CombatantProperties) => Percentage;
  getCritMultiplier: (user: CombatantProperties) => NormalizedPercentage;
  getArmorPenetration: (
    user: CombatantProperties,
    self: CombatActionHitOutcomeProperties
  ) => number;
  getHpChangeProperties: (
    user: CombatantProperties,
    primaryTarget: CombatantProperties
  ) => null | CombatActionResourceChangeProperties;
  getManaChangeProperties: (
    user: CombatantProperties,
    primaryTarget: CombatantProperties
  ) => null | CombatActionResourceChangeProperties;
  getIsParryable: (user: CombatantProperties) => boolean;
  getIsBlockable: (user: CombatantProperties) => boolean;
  getCanTriggerCounterattack: (user: CombatantProperties) => boolean;
  getAppliedConditions: (context: ActionResolutionStepContext) => null | CombatantCondition[];
  getShouldAnimateTargetHitRecovery: () => boolean;
  getThreatGeneratedOnHitOutcomes: (
    context: ActionResolutionStepContext,
    hitOutcomes: CombatActionHitOutcomes
  ) => null | ThreatChanges;
}

export enum ActionHitOutcomePropertiesBaseTypes {
  Spell,
  Melee,
  Ranged,
  Medication,
}

export const genericActionHitOutcomeProperties: CombatActionHitOutcomeProperties = {
  accuracyModifier: 1,
  addsPropertiesFromHoldableSlot: null,
  getUnmodifiedAccuracy: function (user: CombatantProperties): ActionAccuracy {
    return { type: ActionAccuracyType.Unavoidable };
  },
  getCritChance: (user) => BASE_CRIT_CHANCE,
  getCritMultiplier: (user) => BASE_CRIT_MULTIPLIER,
  getArmorPenetration: (user, self) => 0,
  getHpChangeProperties: (user, primaryTarget) => null,
  getManaChangeProperties: () => null,
  getAppliedConditions: (context) => [],
  getIsParryable: (user) => true,
  getIsBlockable: (user) => true,
  getCanTriggerCounterattack: (user) => true,
  getShouldAnimateTargetHitRecovery: () => true,
  getThreatGeneratedOnHitOutcomes: (context, hitOutcomes) => {
    return getStandardThreatGenerationOnHitOutcomes(context, hitOutcomes);
  },
};

const genericRangedHitOutcomeProperties: CombatActionHitOutcomeProperties = {
  ...genericActionHitOutcomeProperties,
  accuracyModifier: 0.9,
  getUnmodifiedAccuracy: function (user: CombatantProperties): ActionAccuracy {
    const userCombatAttributes = CombatantProperties.getTotalAttributes(user);
    return {
      type: ActionAccuracyType.Percentage,
      value: userCombatAttributes[CombatAttribute.Accuracy],
    };
  },
  getCritChance: function (user: CombatantProperties): number {
    return getStandardActionCritChance(user, CombatAttribute.Dexterity);
  },
  getCritMultiplier: function (user: CombatantProperties): number {
    return getStandardActionCritMultiplier(user, CombatAttribute.Focus);
  },
  getArmorPenetration: function (user: CombatantProperties): number {
    return getStandardActionArmorPenetration(user, CombatAttribute.Dexterity);
  },
  getCanTriggerCounterattack: (user: CombatantProperties) => false,
};

const genericMeleeHitOutcomeProperties: CombatActionHitOutcomeProperties = {
  ...genericActionHitOutcomeProperties,
  getUnmodifiedAccuracy: function (user: CombatantProperties): ActionAccuracy {
    const userCombatAttributes = CombatantProperties.getTotalAttributes(user);
    return {
      type: ActionAccuracyType.Percentage,
      value: userCombatAttributes[CombatAttribute.Accuracy],
    };
  },
  getCritChance: function (user: CombatantProperties): number {
    return getStandardActionCritChance(user, CombatAttribute.Dexterity);
  },
  getCritMultiplier: function (user: CombatantProperties): number {
    return getStandardActionCritMultiplier(user, CombatAttribute.Strength);
  },
  getArmorPenetration: function (user: CombatantProperties): number {
    return getStandardActionArmorPenetration(user, CombatAttribute.Strength);
  },
  getManaChangeProperties: (user: CombatantProperties, primaryTarget: CombatantProperties) => null,
  getHpChangeProperties: (user, primaryTarget) => {
    const hpChangeProperties = getAttackResourceChangeProperties(
      genericMeleeHitOutcomeProperties,
      user,
      primaryTarget,
      CombatAttribute.Strength,
      HoldableSlotType.MainHand
    );

    return hpChangeProperties;
  },
  getAppliedConditions: function (user): CombatantCondition[] | null {
    // apply conditions from weapons
    // ex: could make a "poison blade" item
    return null;
  },
};

const genericMedicationConsumableHitOutcomeProperties: CombatActionHitOutcomeProperties = {
  ...genericActionHitOutcomeProperties,
  getIsParryable: (user: CombatantProperties) => false,
  getCanTriggerCounterattack: (user: CombatantProperties) => false,
  getIsBlockable: (user: CombatantProperties) => false,
  getCritChance: () => 0,
  getCritMultiplier: () => 0,
  getArmorPenetration: () => 0,
};

export const GENERIC_HIT_OUTCOME_PROPERTIES: Record<
  ActionHitOutcomePropertiesBaseTypes,
  CombatActionHitOutcomeProperties
> = {
  [ActionHitOutcomePropertiesBaseTypes.Spell]: {
    ...genericActionHitOutcomeProperties,
    getIsParryable: () => false,
    getCanTriggerCounterattack: () => false,
  },
  [ActionHitOutcomePropertiesBaseTypes.Melee]: genericMeleeHitOutcomeProperties,
  [ActionHitOutcomePropertiesBaseTypes.Ranged]: genericRangedHitOutcomeProperties,
  [ActionHitOutcomePropertiesBaseTypes.Medication]: genericMedicationConsumableHitOutcomeProperties,
};
