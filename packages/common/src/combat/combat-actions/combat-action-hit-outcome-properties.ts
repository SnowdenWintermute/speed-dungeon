import { ActionEntity } from "../../action-entities/index.js";
import {
  ActionResolutionStepContext,
  ActivatedTriggersGameUpdateCommand,
} from "../../action-processing/index.js";
import { IActionUser } from "../../action-user-context/action-user.js";
import { CombatantProperties } from "../../combatants/combatant-properties.js";
import { CombatantConditionName, ConditionAppliedBy, ThreatType } from "../../combatants/index.js";
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
  /** Easily modify an action to be a weaker version of another such as an offhand attack */
  resourceChangeValuesModifier: NormalizedPercentage;
  accuracyModifier: NormalizedPercentage;
  critChanceModifier: NormalizedPercentage;
  // used for determining melee attack animation types at start of action
  // @TODO - could be used for generically adding weapon damage and kinetic types to hit outcomes
  addsPropertiesFromHoldableSlot: null | HoldableSlotType;
  getUnmodifiedAccuracy: (user: IActionUser, actionLevel: number) => ActionAccuracy;
  getUnmodifiedCritChance: (user: IActionUser, actionLevel: number) => Percentage | null;
  getCritMultiplier: (user: IActionUser, actionLevel: number) => NormalizedPercentage | null;
  getArmorPenetration: (
    user: IActionUser,
    actionLevel: number,
    self: CombatActionHitOutcomeProperties
  ) => number;
  resourceChangePropertiesGetters: Partial<
    Record<
      CombatActionResource,
      (
        user: IActionUser,
        hitOutcomeProperties: CombatActionHitOutcomeProperties,
        actionLevel: number,
        primaryTarget: CombatantProperties,
        actionEntityOption?: ActionEntity
      ) => null | CombatActionResourceChangeProperties
    >
  >;
  getIsParryable: (user: IActionUser, actionLevel: number) => boolean;
  getIsBlockable: (user: IActionUser, actionLevel: number) => boolean;
  getCanTriggerCounterattack: (user: IActionUser, actionLevel: number) => boolean;
  getAppliedConditions: (
    user: IActionUser,
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
  getOnUseTriggers: (
    context: ActionResolutionStepContext
  ) => Partial<ActivatedTriggersGameUpdateCommand>;
  getHitOutcomeTriggers: (
    context: ActionResolutionStepContext
  ) => Partial<ActivatedTriggersGameUpdateCommand>;
  flatThreatGeneratedOnHit?: Record<ThreatType, number>;
  flatThreatReducedOnMonsterVsPlayerHit?: Record<ThreatType, number>;
}
