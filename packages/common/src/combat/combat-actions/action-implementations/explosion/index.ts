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
import { CombatantContext } from "../../../../combatant-context/index.js";
import { ActionStepTracker } from "../../../../action-processing/action-step-tracker.js";
import { ActionSequenceManager } from "../../../../action-processing/action-sequence-manager.js";
import { StaticVfxActionResolutionStep } from "../../../../action-processing/action-steps/static-vfx.js";
import { AdventuringParty } from "../../../../adventuring-party/index.js";
import { CombatActionTargetType } from "../../../targeting/combat-action-targets.js";

const config: CombatActionComponentConfig = {
  description: "Deals kinetic fire damage in an area around the target",
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
  userShouldMoveHomeOnComplete: true,
  getResourceCosts: () => null,
  getExecutionTime: () => 300,
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
  getFirstResolutionStep(
    combatantContext: CombatantContext,
    actionExecutionIntent: CombatActionExecutionIntent,
    previousTrackerOption: null | ActionStepTracker,
    manager: ActionSequenceManager,
    self
  ) {
    const targets = actionExecutionIntent.targets;
    if (targets.type !== CombatActionTargetType.SingleAndSides)
      return new Error("Unexpected target type provided");
    const centralTargetCombatantResult = AdventuringParty.getCombatant(
      combatantContext.party,
      targets.targetId
    );
    if (centralTargetCombatantResult instanceof Error) return centralTargetCombatantResult;

    const step = new StaticVfxActionResolutionStep(
      { combatantContext, actionExecutionIntent, manager, previousStepOption: null },
      centralTargetCombatantResult.combatantProperties.position.clone(),
      this.getExecutionTime() + 100, // show the explosion animation dissipating after it triggers next step
      this.getExecutionTime(),
      "Explosion"
    );
    return step;
  },
};

export const EXPLOSION = new CombatActionComposite(CombatActionName.Explosion, config);
