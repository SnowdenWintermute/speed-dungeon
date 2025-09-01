import { ActionResolutionStepContext } from "../../action-processing/index.js";
import { BASE_CRIT_CHANCE, BASE_CRIT_MULTIPLIER } from "../../app-consts.js";
import { CombatAttribute } from "../../combatants/attributes/index.js";
import {
  Combatant,
  CombatantConditionName,
  CombatantProperties,
  ConditionAppliedBy,
  ThreatType,
} from "../../combatants/index.js";
import { getStandardThreatChangesOnHitOutcomes } from "../../combatants/threat-manager/get-standard-threat-changes-on-hit-outcomes.js";
import { HoldableSlotType } from "../../items/equipment/slots.js";
import { NormalizedPercentage, Percentage } from "../../primatives/index.js";
import { CombatActionHitOutcomes, ThreatChanges } from "../action-results/index.js";
import {
  getStandardActionArmorPenetration,
  getStandardActionCritChance,
  getStandardActionCritMultiplier,
} from "./action-calculation-utils/standard-action-calculations.js";
import { getAttackResourceChangeProperties } from "./action-implementations/attack/get-attack-hp-change-properties.js";
import { COMBAT_ACTIONS } from "./action-implementations/index.js";
import { ActionAccuracy, ActionAccuracyType } from "./combat-action-accuracy.js";
import { CombatActionResourceChangeProperties } from "./combat-action-resource-change-properties.js";
import { CombatActionComponent } from "./index.js";

export enum CombatActionResource {
  HitPoints,
  Mana,
}

export interface CombatActionHitOutcomeProperties {
  accuracyModifier: NormalizedPercentage;
  // used for determining melee attack animation types at start of action
  // @TODO - could be used for generically adding weapon damage and kinetic types to hit outcomes
  addsPropertiesFromHoldableSlot: null | HoldableSlotType;
  getUnmodifiedAccuracy: (user: CombatantProperties, actionLevel: number) => ActionAccuracy;
  getCritChance: (user: CombatantProperties, actionLevel: number) => Percentage | null;
  getCritMultiplier: (
    user: CombatantProperties,
    actionLevel: number
  ) => NormalizedPercentage | null;
  getArmorPenetration: (
    user: CombatantProperties,
    actionLevel: number,
    self: CombatActionHitOutcomeProperties
  ) => number;
  resourceChangePropertiesGetters: Partial<
    Record<
      CombatActionResource,
      (
        user: CombatantProperties,
        actionLevel: number,
        primaryTarget: CombatantProperties
      ) => null | CombatActionResourceChangeProperties
    >
  >;
  getIsParryable: (user: CombatantProperties, actionLevel: number) => boolean;
  getIsBlockable: (user: CombatantProperties, actionLevel: number) => boolean;
  getCanTriggerCounterattack: (user: CombatantProperties, actionLevel: number) => boolean;
  getAppliedConditions: (
    user: Combatant,
    actionLevel: number
  ) =>
    | null
    | {
        conditionName: CombatantConditionName;
        level: number;
        stacks: number;
        appliedBy: ConditionAppliedBy;
      }[];
  getShouldAnimateTargetHitRecovery: () => boolean;
  getThreatChangesOnHitOutcomes: (
    context: ActionResolutionStepContext,
    hitOutcomes: CombatActionHitOutcomes
  ) => null | ThreatChanges;
  flatThreatGeneratedOnHit?: Record<ThreatType, number>;
  flatThreatReducedOnMonsterVsPlayerHit?: Record<ThreatType, number>;
  getShouldDecayThreatOnUse: (
    context: ActionResolutionStepContext,
    self: CombatActionComponent
  ) => boolean;
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
  resourceChangePropertiesGetters: {},
  getAppliedConditions: (context) => null,
  getIsParryable: (user) => true,
  getIsBlockable: (user) => true,
  getCanTriggerCounterattack: (user) => true,
  getShouldAnimateTargetHitRecovery: () => true,
  getThreatChangesOnHitOutcomes: (context, hitOutcomes) => {
    return getStandardThreatChangesOnHitOutcomes(context, hitOutcomes);
  },
  getShouldDecayThreatOnUse: (
    context: ActionResolutionStepContext,
    self: CombatActionComponent
  ) => {
    const action = COMBAT_ACTIONS[context.tracker.actionExecutionIntent.actionName];
    if (context.combatantContext.combatant.combatantProperties.asShimmedUserOfTriggeredCondition)
      return false;
    if (action.costProperties.requiresCombatTurnInThisContext(context, self)) return true;
    return false;
  },
};

const genericRangedHitOutcomeProperties: CombatActionHitOutcomeProperties = {
  ...genericActionHitOutcomeProperties,
  addsPropertiesFromHoldableSlot: HoldableSlotType.MainHand,
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
    return getStandardActionCritMultiplier(user, null);
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

  resourceChangePropertiesGetters: {
    [CombatActionResource.Mana]: (user, actionLevel, primaryTarget) => null,
    [CombatActionResource.HitPoints]: (user, actionLevel, primaryTarget) => {
      const hpChangeProperties = getAttackResourceChangeProperties(
        genericMeleeHitOutcomeProperties,
        user,
        actionLevel,
        primaryTarget,
        CombatAttribute.Strength
      );

      return hpChangeProperties;
    },
  },
  getAppliedConditions: function (
    user,
    actionLevel
  ):
    | {
        conditionName: CombatantConditionName;
        level: number;
        stacks: number;
        appliedBy: ConditionAppliedBy;
      }[]
    | null {
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
