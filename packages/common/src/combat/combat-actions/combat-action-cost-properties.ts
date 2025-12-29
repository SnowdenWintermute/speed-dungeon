import { CombatActionComponent } from "./index.js";
import { IActionUser } from "../../action-user-context/action-user.js";
import { AdventuringParty } from "../../adventuring-party/index.js";
import { ConsumableType } from "../../items/consumables/consumable-types.js";
import {
  EquipmentSlotType,
  HoldableSlotType,
  WearableSlotType,
} from "../../items/equipment/slots.js";
import {
  ActionResourceCostBases,
  ActionResourceCosts,
} from "./action-calculation-utils/action-costs.js";
import { DurabilityLossCondition } from "./combat-action-durability-loss-condition.js";
import { ActionResolutionStepContext } from "../../action-processing/action-steps/index.js";
import { ActionRank } from "../../aliases.js";

export interface CombatActionCostPropertiesConfig {
  incursDurabilityLoss: {
    [EquipmentSlotType.Wearable]?: Partial<Record<WearableSlotType, DurabilityLossCondition>>;
    [EquipmentSlotType.Holdable]?: Partial<Record<HoldableSlotType, DurabilityLossCondition>>;
  };
  costBases: ActionResourceCostBases;
  getResourceCosts: (
    user: IActionUser,
    inCombat: boolean,
    selectedActionLevel: ActionRank,
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
    party: AdventuringParty
  ) => { meetsRequirements: boolean; reasonDoesNot?: string };
}

// in the constructor of the action we pass "this" to the getResourceCosts function in the config
// so we can then call .getResourceCosts without passing an action to it
export interface CombatActionCostProperties extends CombatActionCostPropertiesConfig {
  getResourceCosts: (
    user: IActionUser,
    inCombat: boolean,
    actionLevel: ActionRank
  ) => null | ActionResourceCosts;
}
