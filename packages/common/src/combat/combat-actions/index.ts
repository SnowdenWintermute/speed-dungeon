export * from "./combat-action-names.js";
export * from "./targeting-schemes-and-categories.js";
export * from "./combat-action-usable-cotexts.js";
export * from "./action-calculation-utils/action-costs.js";
export * from "./combat-action-execution-intent.js";
export * from "./combat-action-animations.js";
export * from "./combat-action-intent.js";
export * from "./combat-action-steps-config.js";
import { Combatant, CombatantProperties } from "../../combatants/index.js";
import { CombatActionUsabilityContext } from "./combat-action-usable-cotexts.js";
import { CombatActionName } from "./combat-action-names.js";
import { Battle } from "../../battle/index.js";
import { ActionAccuracyType } from "./combat-action-accuracy.js";
import { CombatActionRequiredRange } from "./combat-action-range.js";
import { CombatantContext } from "../../combatant-context/index.js";
import { ActionResolutionStepContext, ActionTracker } from "../../action-processing/index.js";
import { CombatActionExecutionIntent } from "./combat-action-execution-intent.js";
import { SpawnableEntity } from "../../spawnables/index.js";
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
import { EntityId } from "../../primatives/index.js";

export enum CombatActionOrigin {
  SpellCast,
  TriggeredCondition,
  Medication,
  Attack,
}

export interface CombatActionComponentConfig {
  description: string;
  /** Used by the combat log to determine how to format messages */
  origin: CombatActionOrigin;

  targetingProperties: CombatActionTargetingPropertiesConfig;
  hitOutcomeProperties: CombatActionHitOutcomeProperties;
  costProperties: CombatActionCostPropertiesConfig;
  stepsConfig: ActionResolutionStepsConfig;

  shouldExecute: (
    combatantContext: CombatantContext,
    previousTrackerOption: undefined | ActionTracker,
    self: CombatActionComponent
  ) => boolean;

  getOnUseMessage: null | ((combatantName: string, actionLevel: number) => string);

  getRequiredRange: (
    user: CombatantProperties,
    self: CombatActionComponent
  ) => CombatActionRequiredRange;

  getSpawnableEntity?: (context: ActionResolutionStepContext) => SpawnableEntity;

  // ACTION HEIRARCHY PROPERTIES
  getChildren: (context: ActionResolutionStepContext) => CombatActionComponent[];
  getConcurrentSubActions?: (context: ActionResolutionStepContext) => CombatActionExecutionIntent[];
  getParent: () => CombatActionComponent | null;
}

export abstract class CombatActionComponent {
  public readonly description: string;
  public readonly origin: CombatActionOrigin;
  public readonly targetingProperties: CombatActionTargetingProperties;
  public readonly hitOutcomeProperties: CombatActionHitOutcomeProperties;
  public readonly costProperties: CombatActionCostProperties;
  public readonly stepsConfig: ActionResolutionStepsConfig;
  protected children?: CombatActionComponent[];

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

  shouldExecute: (
    combatantContext: CombatantContext,
    previousTrackerOption: undefined | ActionTracker
  ) => boolean;
  getOnUseMessage: null | ((combatantName: string, actionLevel: number) => string);
  getRequiredRange: (user: CombatantProperties) => CombatActionRequiredRange;
  getSpawnableEntity?: (context: ActionResolutionStepContext) => SpawnableEntity;

  // if we take in the combatant we can determine the children based on their equipped weapons (melee attack mh, melee attack oh etc)
  // spell levels (level 1 chain lightning only gets 1 ChainLightningArc child) or other status
  // (energetic swings could do multiple attacks based on user's current percent of max hp)
  // could also create random children such as a chaining random elemental damage
  getChildren: (context: ActionResolutionStepContext) => CombatActionComponent[];
  getConcurrentSubActions: (context: ActionResolutionStepContext) => CombatActionExecutionIntent[] =
    () => [];
  getParent: () => CombatActionComponent | null;
  addChild: (childAction: CombatActionComponent) => Error | void = () =>
    new Error("Can't add a child to this component");

  constructor(
    public name: CombatActionName,
    config: CombatActionComponentConfig
  ) {
    this.description = config.description;
    this.origin = config.origin;
    this.targetingProperties = {
      ...config.targetingProperties,
      getAutoTarget: (combatantContext, trackerOption) =>
        config.targetingProperties.getAutoTarget(combatantContext, trackerOption, this),
    };
    this.hitOutcomeProperties = config.hitOutcomeProperties;
    this.costProperties = {
      ...config.costProperties,
      getResourceCosts: (user: CombatantProperties) =>
        config.costProperties.getResourceCosts(user, this),
    };

    this.shouldExecute = (combatantContext, previousTrackerOption) =>
      config.shouldExecute(combatantContext, previousTrackerOption, this);
    this.getOnUseMessage = config.getOnUseMessage;
    this.getRequiredRange = (user) => config.getRequiredRange(user, this);
    this.getSpawnableEntity = config.getSpawnableEntity;
    this.stepsConfig = config.stepsConfig;

    this.getChildren = config.getChildren;
    if (config.getConcurrentSubActions)
      this.getConcurrentSubActions = config.getConcurrentSubActions;
    this.getParent = config.getParent;
  }

  combatantIsValidTarget(
    user: Combatant, // to check who their allies are
    combatant: Combatant, // to check their conditions, traits and other state like current hp
    battleOption: null | Battle // finding out allies/enemies
  ): boolean {
    // for AI behavior
    // - check targetable groups (friend or foe)
    // - check prohibited combatant state
    // - check traits and conditions
    return true;
  }
  getAccuracy(user: CombatantProperties) {
    const baseAccuracy = this.hitOutcomeProperties.getUnmodifiedAccuracy(user);
    if (baseAccuracy.type === ActionAccuracyType.Percentage)
      baseAccuracy.value *= this.hitOutcomeProperties.accuracyModifier;
    return baseAccuracy;
  }
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
