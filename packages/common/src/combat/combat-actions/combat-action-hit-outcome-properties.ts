import { ActionResolutionStepContext } from "../../action-processing/index.js";
import {
  Combatant,
  CombatantConditionName,
  CombatantProperties,
  ConditionAppliedBy,
  ThreatType,
} from "../../combatants/index.js";
import { HoldableSlotType } from "../../items/equipment/slots.js";
import { NormalizedPercentage, Percentage } from "../../primatives/index.js";
import { CombatActionHitOutcomes, ThreatChanges } from "../action-results/index.js";
import { ActionAccuracy } from "./combat-action-accuracy.js";
import { CombatActionResourceChangeProperties } from "./combat-action-resource-change-properties.js";

export enum CombatActionResource {
  HitPoints,
  Mana,
}

export interface CombatActionHitOutcomeProperties {
  accuracyModifier: NormalizedPercentage;
  critChanceModifier: NormalizedPercentage;
  resourceChangeValuesModifier: NormalizedPercentage;
  // used for determining melee attack animation types at start of action
  // @TODO - could be used for generically adding weapon damage and kinetic types to hit outcomes
  addsPropertiesFromHoldableSlot: null | HoldableSlotType;
  getUnmodifiedAccuracy: (user: CombatantProperties, actionLevel: number) => ActionAccuracy;
  getUnmodifiedCritChance: (user: CombatantProperties, actionLevel: number) => Percentage | null;
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
        hitOutcomeProperties: CombatActionHitOutcomeProperties,
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
}
