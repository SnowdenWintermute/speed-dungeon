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
import { AutoTargetingSelectionMethod } from "../targeting/auto-targeting.js";

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
  isMelee: (user: CombatantProperties) => boolean;
  requiresCombatTurn: (user: CombatantProperties) => boolean;
  shouldExecute: (characterAssociatedData: CharacterAssociatedData) => boolean;
  getAnimationsAndEffects: () => void;
  getHpChangeProperties: (user: CombatantProperties) => null | CombatActionHpChangeProperties;
  getAppliedConditions: (user: CombatantProperties) => null | CombatantCondition[];
  getAutoTarget: (characterAssociatedData: CharacterAssociatedData) => null | CombatActionTarget;
  getChildren: (combatant: Combatant) => null | CombatActionComponent[];
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
  isMelee: (user: CombatantProperties) => boolean;
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
  // take the user becasue the hp change properties may be affected by equipment
  getHpChangeProperties: (user: CombatantProperties) => null | CombatActionHpChangeProperties;
  // may be calculated based on combatant equipment or conditions
  getAppliedConditions: (user: CombatantProperties) => null | CombatantCondition[];
  getAutoTarget: (characterAssociatedData: CharacterAssociatedData) => null | CombatActionTarget;
  protected children?: CombatActionComponent[];
  // if we take in the combatant we can determine the children based on their equipped weapons (melee attack mh, melee attack oh etc)
  // spell levels (level 1 chain lightning only gets 1 ChainLightningArc child) or other status
  // (energetic swings could do multiple attacks based on user's current percent of max hp)
  // could also create random children such as a chaining random elemental damage
  getChildren: (combatant: Combatant) => null | CombatActionComponent[];

  addChild: (childAction: CombatActionComponent) => Error | void = () =>
    new Error("Can't add a child to this component");

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
    this.isMelee = config.isMelee;
    this.requiresCombatTurn = config.requiresCombatTurn;
    this.shouldExecute = config.shouldExecute;
    this.getAnimationsAndEffects = config.getAnimationsAndEffects;
    this.getHpChangeProperties = config.getHpChangeProperties;
    this.getAppliedConditions = config.getAppliedConditions;
    this.getAutoTarget = config.getAutoTarget;
    this.getChildren = config.getChildren;
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
