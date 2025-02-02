import {
  CombatActionComponent,
  CombatActionComponentConfig,
  CombatActionComposite,
  CombatActionExecutionIntent,
  CombatActionName,
  CombatActionUsabilityContext,
  TargetCategories,
  TargetingScheme,
} from "../../index.js";
import { CombatantProperties } from "../../../../combatants/index.js";
import { CombatantCondition } from "../../../../combatants/combatant-conditions/index.js";
import { ProhibitedTargetCombatantStates } from "../../prohibited-target-combatant-states.js";
import { ActionAccuracy } from "../../combat-action-accuracy.js";
import { CombatActionRequiredRange } from "../../combat-action-range.js";
import { AutoTargetingScheme } from "../../../targeting/auto-targeting/index.js";
import { CombatActionIntent } from "../../combat-action-intent.js";
import { CHAINING_SPLIT_ARROW_PROJECTILE } from "./chaining-split-arrow-projectile.js";
import { PreUsePositioningActionResolutionStep } from "../../../../action-processing/action-steps/pre-use-positioning.js";
import { ERROR_MESSAGES } from "../../../../errors/index.js";
import { Vector3 } from "@babylonjs/core";

const config: CombatActionComponentConfig = {
  description: "Fire arrows which each bounce to up to two additional targets",
  targetingSchemes: [TargetingScheme.Area],
  validTargetCategories: TargetCategories.Opponent,
  autoTargetSelectionMethod: { scheme: AutoTargetingScheme.UserSelected },
  usabilityContext: CombatActionUsabilityContext.InCombat,
  intent: CombatActionIntent.Malicious,
  prohibitedTargetCombatantStates: [
    ProhibitedTargetCombatantStates.Dead,
    ProhibitedTargetCombatantStates.UntargetableByPhysical,
  ],
  baseHpChangeValuesLevelMultiplier: 1,
  accuracyModifier: 1,
  appliesConditions: [],
  incursDurabilityLoss: {},
  costBases: {},
  getResourceCosts: () => null,
  getExecutionTime: () => 1000,
  requiresCombatTurn: () => true,
  shouldExecute: () => true,
  getAnimationsAndEffects: function (): void {
    // rely on concurrent subactions for this
    throw new Error("Function not implemented.");
  },
  getHpChangeProperties: () => null,
  getAppliedConditions: function (): CombatantCondition[] | null {
    // @TODO - determine based on equipment
    throw new Error("Function not implemented.");
  },
  getChildren: (_user) => [],
  getParent: () => null,
  getRequiredRange: (_user, _self) => CombatActionRequiredRange.Ranged,
  getConcurrentSubActions(combatantContext) {
    return combatantContext.getOpponents().map(() => CHAINING_SPLIT_ARROW_PROJECTILE);
  },
  getUnmodifiedAccuracy: function (user: CombatantProperties): ActionAccuracy {
    throw new Error("Function not implemented.");
  },
  getCritChance: function (user: CombatantProperties): number {
    throw new Error("Function not implemented.");
  },
  getCritMultiplier: function (user: CombatantProperties): number {
    throw new Error("Function not implemented.");
  },
  getArmorPenetration: function (user: CombatantProperties, self: CombatActionComponent): number {
    throw new Error("Function not implemented.");
  },
  getFirstResolutionStep(combatantContext, tracker, self) {
    const step = new PreUsePositioningActionResolutionStep(
      combatantContext,
      tracker.actionExecutionIntent
    );
    const destination = Vector3.Zero();
    step.setDestination(destination);
    return step;
  },
};

export const CHAINING_SPLIT_ARROW_PARENT = new CombatActionComposite(
  CombatActionName.ChainingSplitArrowParent,
  config
);
