import {
  CombatActionComponent,
  CombatActionComponentConfig,
  CombatActionComposite,
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
import { MobileVfxActionResolutionStep } from "../../../../action-processing/action-steps/mobile-vfx.js";
import { CHAINING_SPLIT_ARROW_PARENT } from "./index.js";
import { COMBAT_ACTIONS } from "../index.js";

const MAX_BOUNCES = 2;

const config: CombatActionComponentConfig = {
  description: "An arrow that bounces to up to two additional targets after the first",
  targetingSchemes: [TargetingScheme.Single],
  validTargetCategories: TargetCategories.Opponent,
  autoTargetSelectionMethod: { scheme: AutoTargetingScheme.RandomCombatant },
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
  getExecutionTime: () => 700,
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
  getChildren: (_user, tracker) => {
    let cursor = tracker.previousTrackerInSequenceOption;
    let numBouncesSoFar = 0;
    while (cursor) {
      if (cursor.actionExecutionIntent.actionName === CombatActionName.ChainingSplitArrowProjectile)
        numBouncesSoFar += 1;
      cursor = cursor.previousTrackerInSequenceOption;
    }

    if (numBouncesSoFar < MAX_BOUNCES)
      return [COMBAT_ACTIONS[CombatActionName.ChainingSplitArrowProjectile]];

    return [];
  },
  getParent: () => CHAINING_SPLIT_ARROW_PARENT,
  getRequiredRange: (_user, _self) => CombatActionRequiredRange.Ranged,
  getConcurrentSubActions() {
    return [];
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
    const { previousTrackerInSequenceOption } = tracker;
    const previousTargetInChain = previousTrackerInSequenceOption?.actionExecutionIntent.targets;

    // const step = new MobileVfxActionResolutionStep();
    // return step;
  },
};

export const CHAINING_SPLIT_ARROW_PROJECTILE = new CombatActionComposite(
  CombatActionName.ChainingSplitArrowProjectile,
  config
);
