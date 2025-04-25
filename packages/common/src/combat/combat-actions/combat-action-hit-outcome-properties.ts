import { ActionResolutionStepContext } from "../../action-processing/index.js";
import { BASE_CRIT_CHANCE, BASE_CRIT_MULTIPLIER } from "../../app-consts";
import { CombatAttribute } from "../../combatants/attributes/index.js";
import { PrimedForIceBurstCombatantCondition } from "../../combatants/combatant-conditions/primed-for-ice-burst";
import { CombatantCondition, CombatantProperties } from "../../combatants/index.js";
import { HoldableSlotType } from "../../items/equipment/slots.js";
import { NormalizedPercentage, NumberRange, Percentage } from "../../primatives/index.js";
import {
  ResourceChangeSource,
  ResourceChangeSourceCategory,
  ResourceChangeSourceConfig,
} from "../hp-change-source-types.js";
import { KineticDamageType } from "../kinetic-damage-types.js";
import { MagicalElement } from "../magical-elements";
import {
  getStandardActionArmorPenetration,
  getStandardActionCritChance,
  getStandardActionCritMultiplier,
} from "./action-calculation-utils/standard-action-calculations.js";
import { getAttackResourceChangeProperties } from "./action-implementations/attack/get-attack-hp-change-properties.js";
import { ActionAccuracy, ActionAccuracyType } from "./combat-action-accuracy.js";
import { CombatActionResourceChangeProperties } from "./combat-action-resource-change-properties.js";

export interface CombatActionHitOutcomeProperties {
  accuracyModifier: number;
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
}

export enum ActionHitOutcomePropertiesGenericTypes {
  Spell,
  Melee,
  Ranged,
  Medication,
}

export const genericActionHitOutcomeProperties: CombatActionHitOutcomeProperties = {
  accuracyModifier: 1,
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
  ActionHitOutcomePropertiesGenericTypes,
  CombatActionHitOutcomeProperties
> = {
  [ActionHitOutcomePropertiesGenericTypes.Spell]: {
    ...genericActionHitOutcomeProperties,
    getIsParryable: () => false,
    getCanTriggerCounterattack: () => false,
  },
  [ActionHitOutcomePropertiesGenericTypes.Melee]: { ...genericActionHitOutcomeProperties },
  [ActionHitOutcomePropertiesGenericTypes.Ranged]: genericRangedHitOutcomeProperties,
  [ActionHitOutcomePropertiesGenericTypes.Medication]:
    genericMedicationConsumableHitOutcomeProperties,
};
