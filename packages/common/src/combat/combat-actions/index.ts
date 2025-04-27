export * from "./combat-action-names.js";
export * from "./targeting-schemes-and-categories.js";
export * from "./combat-action-usable-cotexts.js";
export * from "./action-calculation-utils/action-costs.js";
export * from "./combat-action-execution-intent.js";
export * from "./combat-action-animations.js";
import { Combatant, CombatantProperties } from "../../combatants/index.js";
import { CombatActionUsabilityContext } from "./combat-action-usable-cotexts.js";
import { CombatActionName } from "./combat-action-names.js";
import { Battle } from "../../battle/index.js";
import { CombatActionTarget } from "../targeting/combat-action-targets.js";
import { ActionAccuracyType } from "./combat-action-accuracy.js";
import { CombatActionRequiredRange } from "./combat-action-range.js";
import { AUTO_TARGETING_FUNCTIONS } from "../targeting/auto-targeting/mapped-functions.js";
import { CombatActionIntent } from "./combat-action-intent.js";
import { CombatantContext } from "../../combatant-context/index.js";
import {
  ActionMotionPhase,
  ActionResolutionStepContext,
  ActionResolutionStepType,
  EntityDestination,
} from "../../action-processing/index.js";
import { CombatActionExecutionIntent } from "./combat-action-execution-intent.js";
import { CombatActionCombatantAnimations } from "./combat-action-animations.js";
import { ActionTracker } from "../../action-processing/action-tracker.js";
import { SpawnableEntity } from "../../spawnables/index.js";
import { ConsumableType } from "../../items/consumables/index.js";
import { Milliseconds } from "../../primatives/index.js";
import { CosmeticEffectNames } from "../../action-entities/cosmetic-effect.js";
import { AbstractParentType } from "../../action-entities/index.js";
import { CombatActionTargetingProperties } from "./combat-action-targeting-properties.js";
import { CombatActionHitOutcomeProperties } from "./combat-action-hit-outcome-properties.js";
import {
  CombatActionCostProperties,
  CombatActionCostPropertiesConfig,
} from "./combat-action-cost-properties.js";

export interface CombatActionComponentConfig {
  description: string;
  targetingProperties: CombatActionTargetingProperties;
  hitOutcomeProperties: CombatActionHitOutcomeProperties;
  costProperties: CombatActionCostPropertiesConfig;

  intent: CombatActionIntent;
  usabilityContext: CombatActionUsabilityContext;
  shouldExecute: (context: CombatantContext, self: CombatActionComponent) => boolean;
  getRequiredRange: (
    user: CombatantProperties,
    self: CombatActionComponent
  ) => CombatActionRequiredRange;
  motionPhasePositionGetters: Partial<
    Record<
      ActionMotionPhase,
      (context: ActionResolutionStepContext) => Error | null | EntityDestination
    >
  >;

  getAutoTarget?: (
    combatantContext: CombatantContext,
    actionTrackerOption: null | ActionTracker,
    self: CombatActionComponent
  ) => Error | null | CombatActionTarget;

  // STEPS AND ENTITIES
  userShouldMoveHomeOnComplete: boolean;
  getResolutionSteps: () => ActionResolutionStepType[];
  getActionStepAnimations: (
    context: ActionResolutionStepContext
  ) => null | Error | CombatActionCombatantAnimations;
  getCosmeticEffectToStartByStep?: () => Partial<
    Record<
      ActionResolutionStepType,
      { name: CosmeticEffectNames; parentType: AbstractParentType; lifetime?: Milliseconds }[]
    >
  >;
  getCosmeticEffectToStopByStep?: () => Partial<
    Record<ActionResolutionStepType, CosmeticEffectNames[]>
  >;
  getSpawnableEntity?: (context: ActionResolutionStepContext) => SpawnableEntity;

  // ACTION HEIRARCHY PROPERTIES
  getChildren: (context: ActionResolutionStepContext) => CombatActionComponent[];
  getConcurrentSubActions?: (combatantContext: CombatantContext) => CombatActionExecutionIntent[];
  getParent: () => CombatActionComponent | null;
}

export abstract class CombatActionComponent {
  // TO CONSIDER ADDING:
  // shouldDisplayTargetingIndicator()
  // could be useful to hide the indicator of a parent who's children indicate their parent as target as with attack
  // or to hide indicators of bouncing child attacks which would baloon factorially
  public readonly description: string;
  public readonly targetingProperties: CombatActionTargetingProperties;
  public readonly hitOutcomeProperties: CombatActionHitOutcomeProperties;
  public readonly costProperties: CombatActionCostProperties;

  public readonly intent: CombatActionIntent;
  public readonly usabilityContext: CombatActionUsabilityContext;

  readonly userShouldMoveHomeOnComplete: boolean;
  isUsableInGivenContext(context: CombatActionUsabilityContext) {
    switch (context) {
      case CombatActionUsabilityContext.All:
        return true;
      case CombatActionUsabilityContext.InCombat:
        return this.usabilityContext !== CombatActionUsabilityContext.OutOfCombat;
      case CombatActionUsabilityContext.OutOfCombat:
        return this.usabilityContext !== CombatActionUsabilityContext.InCombat;
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
  shouldExecute: (context: CombatantContext) => boolean;
  getActionStepAnimations: (
    context: ActionResolutionStepContext
  ) => null | Error | CombatActionCombatantAnimations;
  getSpawnableEntity?: (context: ActionResolutionStepContext) => SpawnableEntity;
  getCosmeticEffectToStartByStep?: () => Partial<
    Record<
      ActionResolutionStepType,
      { name: CosmeticEffectNames; parentType: AbstractParentType; lifetime?: Milliseconds }[]
    >
  >;
  getCosmeticEffectToStopByStep?: () => Partial<
    Record<ActionResolutionStepType, CosmeticEffectNames[]>
  >;

  getRequiredRange: (user: CombatantProperties) => CombatActionRequiredRange;
  motionPhasePositionGetters: Partial<
    Record<
      ActionMotionPhase,
      (context: ActionResolutionStepContext) => Error | null | EntityDestination
    >
  >;

  getConsumableCost?: () => ConsumableType;

  protected children?: CombatActionComponent[];
  // if we take in the combatant we can determine the children based on their equipped weapons (melee attack mh, melee attack oh etc)
  // spell levels (level 1 chain lightning only gets 1 ChainLightningArc child) or other status
  // (energetic swings could do multiple attacks based on user's current percent of max hp)
  // could also create random children such as a chaining random elemental damage
  getChildren: (context: ActionResolutionStepContext) => CombatActionComponent[];
  getConcurrentSubActions: (combatantContext: CombatantContext) => CombatActionExecutionIntent[] =
    () => [];
  getResolutionSteps: () => ActionResolutionStepType[];
  getParent: () => CombatActionComponent | null;
  addChild: (childAction: CombatActionComponent) => Error | void = () =>
    new Error("Can't add a child to this component");

  constructor(
    public name: CombatActionName,
    config: CombatActionComponentConfig
  ) {
    this.description = config.description;
    this.targetingProperties = config.targetingProperties;
    this.hitOutcomeProperties = config.hitOutcomeProperties;
    this.costProperties = {
      ...config.costProperties,
      getResourceCosts: (user: CombatantProperties) =>
        config.costProperties.getResourceCosts(user, this),
    };

    this.usabilityContext = config.usabilityContext;
    this.intent = config.intent;
    this.userShouldMoveHomeOnComplete = config.userShouldMoveHomeOnComplete;
    this.shouldExecute = (characterAssociatedData) =>
      config.shouldExecute(characterAssociatedData, this);
    this.getActionStepAnimations = config.getActionStepAnimations;
    this.getRequiredRange = (user) => config.getRequiredRange(user, this);
    this.motionPhasePositionGetters = config.motionPhasePositionGetters;
    this.getSpawnableEntity = config.getSpawnableEntity;
    this.getCosmeticEffectToStartByStep = config.getCosmeticEffectToStartByStep;
    this.getCosmeticEffectToStopByStep = config.getCosmeticEffectToStopByStep;

    this.getChildren = config.getChildren;
    if (config.getConcurrentSubActions)
      this.getConcurrentSubActions = config.getConcurrentSubActions;
    this.getParent = config.getParent;
    this.getResolutionSteps = config.getResolutionSteps;
    const { getAutoTarget } = config;
    if (getAutoTarget) {
      this.getAutoTarget = (combatantContext, trackerOption) =>
        getAutoTarget(combatantContext, trackerOption, this);
    }
  }

  getAutoTarget: (
    combatantContext: CombatantContext,
    actionTrackerOption: null | ActionTracker
  ) => Error | null | CombatActionTarget = (combatantContext) => {
    const scheme = this.targetingProperties.autoTargetSelectionMethod.scheme;
    return AUTO_TARGETING_FUNCTIONS[scheme](combatantContext, this);
  };
  combatantIsValidTarget(
    user: Combatant, // to check who their allies are
    combatant: Combatant, // to check their conditions, traits and other state like current hp
    battleOption: null | Battle // finding out allies/enemies
  ): boolean {
    // @TODO
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
