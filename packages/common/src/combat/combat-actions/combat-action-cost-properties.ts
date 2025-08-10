import { CombatActionComponent } from ".";
import { ActionResolutionStepContext } from "../../action-processing/index.js";
import { CombatantProperties } from "../../combatants/index.js";
import { ConsumableType } from "../../items/consumables/index.js";
import {
  EquipmentSlotType,
  HoldableSlotType,
  WearableSlotType,
} from "../../items/equipment/index.js";
import { MaxAndCurrent } from "../../primatives";
import {
  ActionPayableResource,
  ActionResourceCostBases,
  ActionResourceCosts,
  getStandardActionCost,
} from "./action-calculation-utils/action-costs.js";
import { DurabilityLossCondition } from "./combat-action-durability-loss-condition.js";

export interface CombatActionCostPropertiesConfig {
  incursDurabilityLoss: {
    [EquipmentSlotType.Wearable]?: Partial<Record<WearableSlotType, DurabilityLossCondition>>;
    [EquipmentSlotType.Holdable]?: Partial<Record<HoldableSlotType, DurabilityLossCondition>>;
  };
  costBases: ActionResourceCostBases;
  getResourceCosts: (
    user: CombatantProperties,
    inCombat: boolean,
    selectedActionLevel: number,
    self: CombatActionComponent
  ) => null | ActionResourceCosts;
  getCooldownTurns: (user: CombatantProperties, selectedActionLevel: number) => null | number;
  getConsumableCost: () => null | ConsumableType;
  requiresCombatTurn: (context: ActionResolutionStepContext) => boolean;
}

// in the constructor of the action we pass "this" to the getResourceCosts function in the config
// so we can then call .getResourceCosts without passing an action to it
export interface CombatActionCostProperties extends CombatActionCostPropertiesConfig {
  getResourceCosts: (
    user: CombatantProperties,
    inCombat: boolean,
    actionLevel: number
  ) => null | ActionResourceCosts;
}

export const genericCombatActionCostProperties: CombatActionCostPropertiesConfig = {
  incursDurabilityLoss: {},
  costBases: {
    [ActionPayableResource.ActionPoints]: {
      base: 1,
    },
  },
  getResourceCosts: (user, inCombat, selectedActionLevel, self) =>
    getStandardActionCost(user, inCombat, selectedActionLevel, self),
  getConsumableCost: () => null,
  requiresCombatTurn: () => true,
  getCooldownTurns: () => null,
};

export const BASE_SPELL_MANA_COST_BASES = {
  base: 0.25,
  multipliers: {
    actionLevel: 1.2,
    userCombatantLevel: 1.2,
  },
  additives: {
    actionLevel: 1,
    userCombatantLevel: 1,
  },
};

const genericSpellCostProperties: CombatActionCostPropertiesConfig = {
  ...genericCombatActionCostProperties,
  getResourceCosts: getStandardActionCost,
  costBases: {
    [ActionPayableResource.Mana]: BASE_SPELL_MANA_COST_BASES,
  },
};

const genericMedicationCostProperties: CombatActionCostPropertiesConfig = {
  ...genericCombatActionCostProperties,
  getResourceCosts: getStandardActionCost,
  requiresCombatTurn: (context) => false,
};

export enum ActionCostPropertiesBaseTypes {
  Base,
  Spell,
  Medication,
}

export const BASE_ACTION_COST_PROPERTIES: Record<
  ActionCostPropertiesBaseTypes,
  CombatActionCostPropertiesConfig
> = {
  [ActionCostPropertiesBaseTypes.Base]: genericCombatActionCostProperties,
  [ActionCostPropertiesBaseTypes.Spell]: genericSpellCostProperties,
  [ActionCostPropertiesBaseTypes.Medication]: genericMedicationCostProperties,
};
