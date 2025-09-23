import { CombatActionComponent } from ".";
import { ActionResolutionStepContext } from "../../action-processing/index.js";
import { IActionUser } from "../../combatant-context/action-user";
import { ConsumableType } from "../../items/consumables/index.js";
import {
  EquipmentSlotType,
  HoldableSlotType,
  WearableSlotType,
} from "../../items/equipment/index.js";
import {
  ActionResourceCostBases,
  ActionResourceCosts,
} from "./action-calculation-utils/action-costs.js";
import { DurabilityLossCondition } from "./combat-action-durability-loss-condition.js";

export interface CombatActionCostPropertiesConfig {
  incursDurabilityLoss: {
    [EquipmentSlotType.Wearable]?: Partial<Record<WearableSlotType, DurabilityLossCondition>>;
    [EquipmentSlotType.Holdable]?: Partial<Record<HoldableSlotType, DurabilityLossCondition>>;
  };
  costBases: ActionResourceCostBases;
  getResourceCosts: (
    user: IActionUser,
    inCombat: boolean,
    selectedActionLevel: number,
    self: CombatActionComponent
  ) => null | ActionResourceCosts;
  getCooldownTurns: (user: IActionUser, selectedActionLevel: number) => null | number;
  getConsumableCost: (user: IActionUser) => null | { type: ConsumableType; level: number };
  getEndsTurnOnUse: (actionLevel: number) => boolean;
  requiresCombatTurnInThisContext: (
    context: ActionResolutionStepContext,
    self: CombatActionComponent
  ) => boolean;
  getMeetsCustomRequirements?: (
    user: IActionUser,
    actionLevel: number
  ) => { meetsRequirements: boolean; reasonDoesNot?: string };
}

// in the constructor of the action we pass "this" to the getResourceCosts function in the config
// so we can then call .getResourceCosts without passing an action to it
export interface CombatActionCostProperties extends CombatActionCostPropertiesConfig {
  getResourceCosts: (
    user: IActionUser,
    inCombat: boolean,
    actionLevel: number
  ) => null | ActionResourceCosts;
}
