export * from "./combat-action-names.js";
export * from "./targeting-schemes-and-categories.js";
export * from "./combat-action-usable-cotexts.js";
export * from "./action-calculation-utils/action-costs.js";
export * from "./combat-action-execution-intent.js";
export * from "./combat-action-animations.js";
import { Combatant, CombatantProperties } from "../../combatants/index.js";
import {
  EquipmentSlotType,
  HoldableSlotType,
  WearableSlotType,
} from "../../items/equipment/slots.js";
import { ProhibitedTargetCombatantStates } from "./prohibited-target-combatant-states.js";
import { TargetCategories, TargetingScheme } from "./targeting-schemes-and-categories.js";
import { CombatantCondition } from "../../combatants/combatant-conditions/index.js";
import { CombatActionUsabilityContext } from "./combat-action-usable-cotexts.js";
import { DurabilityLossCondition } from "./combat-action-durability-loss-condition.js";
import { COMBAT_ACTION_NAME_STRINGS, CombatActionName } from "./combat-action-names.js";
import { CombatActionHpChangeProperties } from "./combat-action-hp-change-properties.js";
import { Battle } from "../../battle/index.js";
import { CombatActionTarget } from "../targeting/combat-action-targets.js";
import { AutoTargetingSelectionMethod } from "../targeting/index.js";
import { ActionAccuracy, ActionAccuracyType } from "./combat-action-accuracy.js";
import { CombatActionRequiredRange } from "./combat-action-range.js";
import { AUTO_TARGETING_FUNCTIONS } from "../targeting/auto-targeting/mapped-functions.js";
import {
  ActionResourceCostBases,
  ActionResourceCosts,
} from "./action-calculation-utils/action-costs.js";
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
import { CombatActionUser } from "./combat-action-users.js";

export interface CombatActionComponentConfig {
  description: string;
  intent: CombatActionIntent;

  targetingSchemes: TargetingScheme[];
  validTargetCategories: TargetCategories;
  autoTargetSelectionMethod: AutoTargetingSelectionMethod;
  usabilityContext: CombatActionUsabilityContext;
  prohibitedTargetCombatantStates: ProhibitedTargetCombatantStates[];

  baseHpChangeValuesLevelMultiplier: number;
  accuracyModifier: number;

  incursDurabilityLoss: {
    [EquipmentSlotType.Wearable]?: Partial<Record<WearableSlotType, DurabilityLossCondition>>;
    [EquipmentSlotType.Holdable]?: Partial<Record<HoldableSlotType, DurabilityLossCondition>>;
  };
  costBases: ActionResourceCostBases;

  userShouldMoveHomeOnComplete: boolean;
  shouldExecute: (combatantContext: CombatantContext, self: CombatActionComponent) => boolean;
  getActionStepAnimations: (
    context: ActionResolutionStepContext
  ) => null | Error | CombatActionCombatantAnimations;
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
  getSpawnableEntity?: (context: ActionResolutionStepContext) => SpawnableEntity;

  getResourceCosts: (
    user: CombatantProperties,
    self: CombatActionComponent
  ) => null | ActionResourceCosts;
  getExecutionTime: () => number;
  requiresCombatTurn: (user: CombatantProperties) => boolean;
  /** A numeric percentage which will be used against the target's evasion */
  getUnmodifiedAccuracy: (user: CombatantProperties) => ActionAccuracy;
  /** A numeric percentage which will be used against the target's crit avoidance */
  getCritChance: (user: CombatantProperties) => number;
  getCritMultiplier: (user: CombatantProperties) => number;
  getArmorPenetration: (user: CombatantProperties, self: CombatActionComponent) => number;
  getHpChangeProperties: (
    user: CombatantProperties,
    primaryTarget: CombatantProperties,
    self: CombatActionComponent
  ) => null | CombatActionHpChangeProperties;
  getIsParryable: (user: CombatantProperties) => boolean;
  getIsBlockable: (user: CombatantProperties) => boolean;
  getCanTriggerCounterattack: (user: CombatantProperties) => boolean;

  getAppliedConditions: (context: ActionResolutionStepContext) => null | CombatantCondition[];
  getChildren: (
    combatantContext: CombatantContext,
    tracker: ActionTracker
  ) => CombatActionComponent[];
  getConcurrentSubActions?: (combatantContext: CombatantContext) => CombatActionExecutionIntent[];
  getParent: () => CombatActionComponent | null;
  getResolutionSteps: () => ActionResolutionStepType[];
  getAutoTarget?: (
    combatantContext: CombatantContext,
    actionTrackerOption: null | ActionTracker,
    self: CombatActionComponent
  ) => Error | null | CombatActionTarget;
}

export abstract class CombatActionComponent {
  // TO CONSIDER ADDING:
  // shouldDisplayTargetingIndicator()
  // could be useful to hide the indicator of a parent who's children indicate their parent as target as with attack
  // or to hide indicators of bouncing child attacks which would baloon factorially
  public readonly description: string;
  public readonly targetingSchemes: TargetingScheme[];
  public readonly validTargetCategories: TargetCategories;
  public readonly autoTargetSelectionMethod: AutoTargetingSelectionMethod;
  public readonly intent: CombatActionIntent;
  public readonly usabilityContext: CombatActionUsabilityContext;
  public readonly prohibitedTargetCombatantStates: ProhibitedTargetCombatantStates[];
  public readonly baseHpChangeValuesLevelMultiplier: number; // @TODO - actually use this for attack et al, or remove it
  public readonly accuracyModifier: number;
  incursDurabilityLoss: {
    [EquipmentSlotType.Wearable]?: Partial<Record<WearableSlotType, DurabilityLossCondition>>;
    [EquipmentSlotType.Holdable]?: Partial<Record<HoldableSlotType, DurabilityLossCondition>>;
  };
  readonly costBases: ActionResourceCostBases;
  readonly userShouldMoveHomeOnComplete: boolean;
  getExecutionTime: () => number;
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
  shouldExecute: (combatantContext: CombatantContext) => boolean;
  getActionStepAnimations: (
    context: ActionResolutionStepContext
  ) => null | Error | CombatActionCombatantAnimations;
  getSpawnableEntity?: (context: ActionResolutionStepContext) => SpawnableEntity;

  getRequiredRange: (user: CombatantProperties) => CombatActionRequiredRange;
  motionPhasePositionGetters: Partial<
    Record<
      ActionMotionPhase,
      (context: ActionResolutionStepContext) => Error | null | EntityDestination
    >
  >;
  requiresCombatTurn: (user: CombatantProperties) => boolean;
  getResourceCosts: (user: CombatantProperties) => null | ActionResourceCosts;
  getAccuracy: (user: CombatantProperties) => ActionAccuracy;
  getIsParryable: (user: CombatantProperties) => boolean;
  getIsBlockable: (user: CombatantProperties) => boolean;
  getCanTriggerCounterattack: (user: CombatantProperties) => boolean;
  getCritChance: (user: CombatantProperties) => number;
  getCritMultiplier: (user: CombatantProperties) => number;
  getArmorPenetration: (user: CombatantProperties) => number;
  getHpChangeProperties: (
    user: CombatantProperties, // take the user becasue the hp change properties may be affected by equipment
    primaryTarget: CombatantProperties // to select the most effective hp change source properties on target
  ) => null | CombatActionHpChangeProperties;

  // may be calculated based on combatant equipment or conditions
  getAppliedConditions: (context: ActionResolutionStepContext) => null | CombatantCondition[];
  protected children?: CombatActionComponent[];
  // if we take in the combatant we can determine the children based on their equipped weapons (melee attack mh, melee attack oh etc)
  // spell levels (level 1 chain lightning only gets 1 ChainLightningArc child) or other status
  // (energetic swings could do multiple attacks based on user's current percent of max hp)
  // could also create random children such as a chaining random elemental damage
  getChildren: (
    combatantContext: CombatantContext,
    tracker: ActionTracker
  ) => CombatActionComponent[];
  getConcurrentSubActions: (combatantContext: CombatantContext) => CombatActionExecutionIntent[] =
    () => [];
  getResolutionSteps: () => ActionResolutionStepType[];
  getParent: () => CombatActionComponent | null;
  addChild: (childAction: CombatActionComponent) => Error | void = () =>
    new Error("Can't add a child to this component");

  // DEFAULT FUNCTIONS
  getAutoTarget: (
    combatantContext: CombatantContext,
    actionTrackerOption: null | ActionTracker
  ) => Error | null | CombatActionTarget = (combatantContext) => {
    const scheme = this.autoTargetSelectionMethod.scheme;
    console.log("auto targeting scheme for", COMBAT_ACTION_NAME_STRINGS[this.name], scheme);
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

  constructor(
    public name: CombatActionName,
    config: CombatActionComponentConfig
  ) {
    this.description = config.description;
    this.targetingSchemes = config.targetingSchemes;
    this.validTargetCategories = config.validTargetCategories;
    this.autoTargetSelectionMethod = config.autoTargetSelectionMethod;
    this.usabilityContext = config.usabilityContext;
    this.intent = config.intent;
    this.prohibitedTargetCombatantStates = config.prohibitedTargetCombatantStates;
    this.baseHpChangeValuesLevelMultiplier = config.baseHpChangeValuesLevelMultiplier;
    this.accuracyModifier = config.accuracyModifier;
    this.incursDurabilityLoss = config.incursDurabilityLoss;
    this.costBases = config.costBases;
    this.userShouldMoveHomeOnComplete = config.userShouldMoveHomeOnComplete;
    this.getResourceCosts = (user: CombatantProperties) => config.getResourceCosts(user, this);
    this.getExecutionTime = config.getExecutionTime;
    this.requiresCombatTurn = config.requiresCombatTurn;
    this.shouldExecute = (characterAssociatedData) =>
      config.shouldExecute(characterAssociatedData, this);
    this.getActionStepAnimations = config.getActionStepAnimations;
    this.getAccuracy = (user: CombatantProperties) => {
      const baseAccuracy = config.getUnmodifiedAccuracy(user);
      if (baseAccuracy.type === ActionAccuracyType.Percentage)
        baseAccuracy.value *= this.accuracyModifier;
      return baseAccuracy;
    };
    this.getIsParryable = config.getIsParryable;
    this.getCanTriggerCounterattack = config.getCanTriggerCounterattack;
    this.getIsBlockable = config.getIsBlockable;
    this.getCritChance = config.getCritChance;
    this.getCritMultiplier = config.getCritMultiplier;
    this.getArmorPenetration = (user) => config.getArmorPenetration(user, this);
    this.getRequiredRange = (user) => config.getRequiredRange(user, this);
    this.motionPhasePositionGetters = config.motionPhasePositionGetters;
    this.getSpawnableEntity = config.getSpawnableEntity;
    this.getHpChangeProperties = (user, target) => config.getHpChangeProperties(user, target, this);
    this.getAppliedConditions = config.getAppliedConditions;
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
