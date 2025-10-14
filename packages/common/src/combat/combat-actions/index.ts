export * from "./combat-action-hit-outcome-properties.js";
export * from "./combat-action-names.js";
export * from "./targeting-schemes-and-categories.js";
export * from "./combat-action-usable-cotexts.js";
export * from "./action-calculation-utils/action-costs.js";
export * from "./combat-action-execution-intent.js";
export * from "./combat-action-animations.js";
export * from "./combat-action-intent.js";
export * from "./combat-action-steps-config.js";
export * from "./combat-action-resource-change-properties.js";
export * from "./combat-action-accuracy.js";
export * from "./combat-action-combat-log-properties.js";
export * from "./action-implementations/generic-action-templates/pets.js";

import { CombatActionUsabilityContext } from "./combat-action-usable-cotexts.js";
import { COMBAT_ACTION_NAME_STRINGS, CombatActionName } from "./combat-action-names.js";
import { Battle } from "../../battle/index.js";
import { ActionAccuracyType } from "./combat-action-accuracy.js";
import {
  ActionIntentAndUser,
  ActionResolutionStepContext,
  ActionTracker,
} from "../../action-processing/index.js";
import {
  CombatActionTargetingProperties,
  CombatActionTargetingPropertiesConfig,
} from "./combat-action-targeting-properties.js";
import { CombatActionHitOutcomeProperties } from "./combat-action-hit-outcome-properties.js";
import {
  CombatActionCostProperties,
  CombatActionCostPropertiesConfig,
} from "./combat-action-cost-properties.js";
import { ActionResolutionStepsConfig } from "./combat-action-steps-config.js";
import { AbilityTreeAbility } from "../../abilities/index.js";
import { CombatActionGameLogProperties } from "./combat-action-combat-log-properties.js";
import { IActionUser } from "../../action-user-context/action-user.js";
import { CombatActionExecutionIntent } from "./combat-action-execution-intent.js";

export interface CombatActionComponentConfig {
  // unique to each action
  description: string;
  byRankDescriptions?: { [rank: number]: string | null };
  prerequisiteAbilities?: AbilityTreeAbility[];
  // properties objects
  targetingProperties: CombatActionTargetingPropertiesConfig;
  hitOutcomeProperties: CombatActionHitOutcomeProperties;
  costProperties: CombatActionCostPropertiesConfig;
  stepsConfig: ActionResolutionStepsConfig;
  hierarchyProperties: CombatActionHierarchyProperties;
  gameLogMessageProperties: CombatActionGameLogProperties;
}

export abstract class CombatActionComponent {
  public readonly description: string;
  public readonly byRankDescriptions: { [rank: number]: string | null } = {};
  public readonly prerequisiteAbilities?: AbilityTreeAbility[];
  public readonly targetingProperties: CombatActionTargetingProperties;
  public hitOutcomeProperties: CombatActionHitOutcomeProperties;
  public readonly gameLogMessageProperties: CombatActionGameLogProperties;
  public readonly costProperties: CombatActionCostProperties;
  public readonly stepsConfig: ActionResolutionStepsConfig;
  hierarchyProperties: CombatActionHierarchyProperties;
  protected children?: CombatActionComponent[];

  constructor(
    public name: CombatActionName,
    config: CombatActionComponentConfig
  ) {
    this.description = config.description;
    if (config.byRankDescriptions) this.byRankDescriptions = config.byRankDescriptions;

    this.gameLogMessageProperties = config.gameLogMessageProperties;

    this.prerequisiteAbilities = config.prerequisiteAbilities;
    this.targetingProperties = {
      ...config.targetingProperties,
      getAutoTarget: (combatantContext, trackerOption) =>
        config.targetingProperties.getAutoTarget(combatantContext, trackerOption, this),
    };
    this.hitOutcomeProperties = config.hitOutcomeProperties;
    this.costProperties = {
      ...config.costProperties,
      getResourceCosts: (user: IActionUser, inCombat: boolean, actionLevel: number) =>
        config.costProperties.getResourceCosts(user, inCombat, actionLevel, this),
    };

    this.stepsConfig = config.stepsConfig;

    this.hierarchyProperties = config.hierarchyProperties;
  }

  getStringName() {
    return COMBAT_ACTION_NAME_STRINGS[this.name];
  }

  shouldExecute(
    context: ActionResolutionStepContext,
    previousTrackerOption: undefined | ActionTracker
  ) {
    const { executionPreconditions } = this.targetingProperties;
    if (executionPreconditions.length === 0) return true;

    return executionPreconditions.every((fn) => fn(context, previousTrackerOption, this));
  }

  getAccuracy(user: IActionUser, actionLevel: number) {
    const baseAccuracy = this.hitOutcomeProperties.getUnmodifiedAccuracy(user, actionLevel);
    if (baseAccuracy.type === ActionAccuracyType.Percentage)
      baseAccuracy.value *= this.hitOutcomeProperties.accuracyModifier;
    return baseAccuracy;
  }

  getCritChance(user: IActionUser, actionLevel: number) {
    const base = this.hitOutcomeProperties.getUnmodifiedCritChance(user, actionLevel);
    if (base === null) return base;
    const modified = base * this.hitOutcomeProperties.critChanceModifier;

    return modified;
  }

  isUsableInGivenContext(context: CombatActionUsabilityContext) {
    switch (context) {
      case CombatActionUsabilityContext.All:
        return true;
      case CombatActionUsabilityContext.InCombat:
        return (
          this.targetingProperties.usabilityContext !== CombatActionUsabilityContext.OutOfCombat
        );
      case CombatActionUsabilityContext.OutOfCombat:
        return this.targetingProperties.usabilityContext !== CombatActionUsabilityContext.InCombat;
    }
  }

  isUsableInThisContext: (battleOption: Battle | null) => boolean = (
    battleOption: Battle | null
  ) => {
    const context = battleOption
      ? CombatActionUsabilityContext.InCombat
      : CombatActionUsabilityContext.OutOfCombat;
    return this.isUsableInGivenContext(context);
  };
}

export class CombatActionLeaf extends CombatActionComponent {}
export class CombatActionComposite extends CombatActionComponent {
  protected children: CombatActionComponent[] = [];
  addChild: (childAction: CombatActionComponent) => void | Error = (
    childAction: CombatActionComponent
  ) => {
    this.children.push(childAction);
  };
}

// if we take in the combatant we can determine the children based on their equipped weapons (melee attack mh, melee attack oh etc)
// spell levels (level 1 chain lightning only gets 1 ChainLightningArc child) or other status
// (energetic swings could do multiple attacks based on user's current percent of max hp)
// could also create random children such as a chaining random elemental damage
// getChildren: (context: ActionResolutionStepContext) => CombatActionComponent[];
// getConcurrentSubActions: (context: ActionResolutionStepContext) => CombatActionExecutionIntent[] =
//   () => [];
// getParent: () => CombatActionComponent | null;
export interface CombatActionHierarchyProperties {
  getChildren: (
    context: ActionResolutionStepContext,
    self: CombatActionComponent
  ) => CombatActionExecutionIntent[];
  getParent: () => CombatActionComponent | null;
  getConcurrentSubActions?: (context: ActionResolutionStepContext) => ActionIntentAndUser[];
}

export const BASE_ACTION_HIERARCHY_PROPERTIES: CombatActionHierarchyProperties = {
  getChildren: function (context: ActionResolutionStepContext): CombatActionExecutionIntent[] {
    return [];
  },
  getParent: function (): CombatActionComponent | null {
    return null;
  },
};
