export * from "./combat-action-names.js";
export * from "./get-ability-mana-cost.js";
export * from "./combat-action-requires-melee-range.js";
export * from "./get-combat-action-execution-time.js";
export * from "./targeting-schemes-and-categories.js";
export * from "./combat-action-usable-cotexts.js";
import { Combatant, CombatantProperties } from "../../combatants/index.js";
import { ConsumableType } from "../../items/consumables/index.js";
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
import { CombatActionName } from "./combat-action-names.js";
import { CombatActionHpChangeProperties } from "./combat-action-hp-change-properties.js";
import { Battle } from "../../battle/index.js";
import { CombatActionTarget } from "../targeting/combat-action-targets.js";
import { CharacterAssociatedData } from "../../types.js";
import { AutoTargetingSelectionMethod } from "../targeting/index.js";
import { ActionAccuracy } from "./combat-action-accuracy.js";
import { CombatActionRequiredRange } from "./combat-action-range.js";
import { AUTO_TARGETING_FUNCTIONS } from "../targeting/auto-targeting/mapped-functions.js";

export interface CombatActionCost {
  base: number;
  multipliers?: CombatActionCostMultipliers;
}
export interface CombatActionCostMultipliers {
  actionLevel?: number;
  userCombatantLevel?: number;
}

export interface CombatActionComponentConfig {
  description: string;
  targetingSchemes: TargetingScheme[];
  validTargetCategories: TargetCategories;
  autoTargetSelectionMethod: null | AutoTargetingSelectionMethod;
  usabilityContext: CombatActionUsabilityContext;
  prohibitedTargetCombatantStates: ProhibitedTargetCombatantStates[];
  baseHpChangeValuesLevelMultiplier: number;
  accuracyPercentModifier: number;
  appliesConditions: CombatantCondition[];
  incursDurabilityLoss: {
    [EquipmentSlotType.Wearable]?: Partial<Record<WearableSlotType, DurabilityLossCondition>>;
    [EquipmentSlotType.Holdable]?: Partial<Record<HoldableSlotType, DurabilityLossCondition>>;
  };
  costs: null | {
    hp?: CombatActionCost;
    mp?: CombatActionCost;
    shards?: CombatActionCost;
    quickActions?: CombatActionCost;
    consumableType?: ConsumableType;
  };
  getExecutionTime: () => number;
  requiresCombatTurn: (user: CombatantProperties) => boolean;
  shouldExecute: (characterAssociatedData: CharacterAssociatedData) => boolean;
  getAnimationsAndEffects: () => void;
  getRequiredRange: (user: CombatantProperties) => CombatActionRequiredRange;
  /** A numeric percentage which will be used against the target's evasion */
  getAccuracy: (user: CombatantProperties) => ActionAccuracy;
  /** A numeric percentage which will be used against the target's crit avoidance */
  getCritChance: (user: CombatantProperties) => number;
  getCritMultiplier: (user: CombatantProperties) => number;
  getHpChangeProperties: (
    user: CombatantProperties,
    primaryTarget: CombatantProperties
  ) => Error | null | CombatActionHpChangeProperties;
  getAppliedConditions: (user: CombatantProperties) => null | CombatantCondition[];
  getChildren: (combatant: Combatant) => null | CombatActionComponent[];
  getParent: () => CombatActionComponent | null;
}

export abstract class CombatActionComponent {
  // TO CONSIDER ADDING:
  // shouldDisplayTargetingIndicator()
  // could be useful to hide the indicator of a parent who's children indicate their parent as target as with attack
  // or to hide indicators of bouncing child attacks which would baloon factorially
  public description: string;
  public targetingSchemes: TargetingScheme[];
  public validTargetCategories: TargetCategories;
  public autoTargetSelectionMethod: null | AutoTargetingSelectionMethod;
  private usabilityContext: CombatActionUsabilityContext;
  prohibitedTargetCombatantStates: ProhibitedTargetCombatantStates[];
  baseHpChangeValuesLevelMultiplier: number;
  accuracyPercentModifier: number;
  private appliesConditions: CombatantCondition[];
  incursDurabilityLoss: {
    [EquipmentSlotType.Wearable]?: Partial<Record<WearableSlotType, DurabilityLossCondition>>;
    [EquipmentSlotType.Holdable]?: Partial<Record<HoldableSlotType, DurabilityLossCondition>>;
  };
  costs: null | {
    hp?: CombatActionCost;
    mp?: CombatActionCost;
    shards?: CombatActionCost;
    quickActions?: CombatActionCost;
    consumableType?: ConsumableType;
  };
  getExecutionTime: () => number;
  isUsableInThisContext: (battleOption: Battle | null) => boolean = (
    battleOption: Battle | null
  ) => {
    switch (this.usabilityContext) {
      case CombatActionUsabilityContext.All:
        return true;
      case CombatActionUsabilityContext.InCombat:
        return battleOption !== null;
      case CombatActionUsabilityContext.OutOfCombat:
        return battleOption === null;
    }
  };
  // take the user so we can for example check during attackMeleeMh if they have a shield equipped, therefore it should end turn
  // also possible to check if they have a "tired" debuff which causes all actions to end turn
  requiresCombatTurn: (user: CombatantProperties) => boolean;
  // could use the combatant's ability to hold state which may help determine, such as if using chain lightning and an enemy
  // target exists that is not the last arced to target
  shouldExecute: (characterAssociatedData: CharacterAssociatedData) => boolean;
  // CATEGORIES
  // pre-use
  // on-success
  // on-failure
  //
  // TYPES
  // combatant moves self to position (combatantId, destination, getPercentCompleteToProceed(), onProceed())
  // animate combatant (combatantId, animationName, getPercentCompleteToProceed(), onProceed())
  // animate combatantEquipment (combatantId,equipmentId, animationName, getPercentCompleteToProceed(), onProceed())
  // spawn mobile effect (effectName (Arrow, Firebolt), origin, destination, speed, easingFn, getPercentCompleteToProceed(), onProceed())
  // spawn stream effect (effectName (lightning arc, healing beam), origin, destination, duration, easingFn, getPercentCompleteToProceed(), onProceed())
  // spawn static effect (effectName (Protect, SpellSparkles), position, duration, getPercentCompleteToProceed(), onProceed())
  getAnimationsAndEffects: () => void;
  getRequiredRange: (user: CombatantProperties) => CombatActionRequiredRange;
  getAccuracy: (user: CombatantProperties) => ActionAccuracy;
  getCritChance: (user: CombatantProperties) => number;
  getCritMultiplier: (user: CombatantProperties) => number;
  // take the user becasue the hp change properties may be affected by equipment
  // take the target because we may need to select the most effective hp change source properties on that target
  getHpChangeProperties: (
    user: CombatantProperties,
    primaryTarget: CombatantProperties
  ) => Error | null | CombatActionHpChangeProperties;
  // may be calculated based on combatant equipment or conditions
  getAppliedConditions: (user: CombatantProperties) => null | CombatantCondition[];
  protected children?: CombatActionComponent[];
  // if we take in the combatant we can determine the children based on their equipped weapons (melee attack mh, melee attack oh etc)
  // spell levels (level 1 chain lightning only gets 1 ChainLightningArc child) or other status
  // (energetic swings could do multiple attacks based on user's current percent of max hp)
  // could also create random children such as a chaining random elemental damage
  getChildren: (combatant: Combatant) => null | CombatActionComponent[];
  getParent: () => CombatActionComponent | null;
  addChild: (childAction: CombatActionComponent) => Error | void = () =>
    new Error("Can't add a child to this component");

  // DEFAULT FUNCTIONS

  getAutoTarget: (
    characterAssociatedData: CharacterAssociatedData,
    combatAction: CombatActionComponent
  ) => Error | null | CombatActionTarget = (characterAssociatedData, combatAction) => {
    const scheme = combatAction.autoTargetSelectionMethod?.scheme;
    if (!scheme) return null;
    return AUTO_TARGETING_FUNCTIONS[scheme](characterAssociatedData, combatAction);
  };

  constructor(
    public name: CombatActionName,
    config: CombatActionComponentConfig
  ) {
    this.description = config.description;
    this.targetingSchemes = config.targetingSchemes;
    this.validTargetCategories = config.validTargetCategories;
    this.autoTargetSelectionMethod = config.autoTargetSelectionMethod;
    this.usabilityContext = config.usabilityContext;
    this.prohibitedTargetCombatantStates = config.prohibitedTargetCombatantStates;
    this.baseHpChangeValuesLevelMultiplier = config.baseHpChangeValuesLevelMultiplier;
    this.accuracyPercentModifier = config.accuracyPercentModifier;
    this.appliesConditions = config.appliesConditions;
    this.incursDurabilityLoss = config.incursDurabilityLoss;
    this.costs = config.costs;
    this.getExecutionTime = config.getExecutionTime;
    this.requiresCombatTurn = config.requiresCombatTurn;
    this.shouldExecute = config.shouldExecute;
    this.getAnimationsAndEffects = config.getAnimationsAndEffects;
    this.getAccuracy = config.getAccuracy;
    this.getCritChance = config.getCritChance;
    this.getCritMultiplier = config.getCritMultiplier;
    this.getRequiredRange = config.getRequiredRange;
    this.getHpChangeProperties = config.getHpChangeProperties;
    this.getAppliedConditions = config.getAppliedConditions;
    this.getChildren = config.getChildren;
    this.getParent = config.getParent;
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
