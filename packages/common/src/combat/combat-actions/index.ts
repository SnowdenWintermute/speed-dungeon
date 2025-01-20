export * from "./combat-action-properties.js";
export * from "./get-ability-mana-cost.js";
export * from "./combat-action-requires-melee-range.js";
export * from "./get-combat-action-execution-time.js";
export * from "./targeting-schemes-and-categories.js";

import { AdventuringParty } from "../../adventuring-party/index.js";
import { DEFAULT_COMBAT_ACTION_PERFORMANCE_TIME } from "../../app-consts.js";
import { AbilityName, CombatantProperties } from "../../combatants/index.js";
import { ConsumableType } from "../../items/consumables/index.js";
import {
  EquipmentSlotType,
  HoldableSlotType,
  WearableSlotType,
} from "../../items/equipment/slots.js";
import {
  ActionUsableContext,
  CombatActionHpChangeProperties,
  CombatActionProperties,
  DurabilityLossCondition,
} from "../index.js";
import {
  ProhibitedTargetCombatantStates,
  TargetCategories,
  TargetingScheme,
} from "./targeting-schemes-and-categories.js";

export enum CombatActionType {
  AbilityUsed,
  ConsumableUsed,
}

export interface AbilityUsed {
  type: CombatActionType.AbilityUsed;
  abilityName: AbilityName;
}

export interface ConsumableUsed {
  type: CombatActionType.ConsumableUsed;
  itemId: string;
  // used on client for displaying dummy conusmables in the shop menu
  // otherwise we would just determine the consumable type by the itemId found in the inventory of the combatant
  consumableType?: ConsumableType;
}

export type CombatAction = ConsumableUsed | AbilityUsed;

// client or AI selects a CombatAction
// server get

// when calculating composite action results
// traverse depth first and get child action results
// compose action commands
// apply action commands to game
// check if should continue
// once done
// - evaluate the outcome
// - unapply all results
//
// CombatActionProperties
// CombatActionPropertiesComposite
// CombatActionPropertiesLeaf

export interface CombatActionCost {
  base: number;
  multipliers?: CombatActionCostMultipliers;
}
export interface CombatActionCostMultipliers {
  actionLevel?: number;
  userCombatantLevel?: number;
}

export abstract class CombatActionComponent {
  targetingSchemes: TargetingScheme[] = [TargetingScheme.Single];
  validTargetCategories: TargetCategories = TargetCategories.Opponent;
  usabilityContext: ActionUsableContext = ActionUsableContext.InCombat;
  prohibitedTargetCombatantStates?: ProhibitedTargetCombatantStates[] = [
    ProhibitedTargetCombatantStates.Dead,
  ];
  requiresCombatTurn: (user: CombatantProperties) => boolean = () => true;
  shouldExecuteNextLeaf: (party: AdventuringParty, user: CombatantProperties) => boolean = () =>
    false;
  hpChangeProperties?: CombatActionHpChangeProperties;
  description: string = "";
  isMelee: boolean = true;
  accuracyPercentModifier: number = 100;
  incursDurabilityLoss?: {
    [EquipmentSlotType.Wearable]?: Partial<Record<WearableSlotType, DurabilityLossCondition>>;
    [EquipmentSlotType.Holdable]?: Partial<Record<HoldableSlotType, DurabilityLossCondition>>;
  };
  getChildren: () => null | CombatActionComponent[] = () => null;
  addChild: () => Error | void = () => new Error("Can't add a child to this component");
  execute: () => Error | void = () => {
    new Error("Execute was not implemented on this combat action");
    //
  };
  constructor(
    public type: CombatActionType,
    public costs: {
      hp?: CombatActionCost;
      mp?: CombatActionCost;
      shards?: CombatActionCost;
      quickActions?: CombatActionCost;
      consumableType?: ConsumableType;
    },
    public baseHpChangeValuesLevelMultiplier: number = 1.0,
    public executionTime: number = DEFAULT_COMBAT_ACTION_PERFORMANCE_TIME
  ) {}
}
