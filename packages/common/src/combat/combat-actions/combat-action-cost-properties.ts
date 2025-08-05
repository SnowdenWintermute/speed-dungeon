import { CombatActionComponent } from ".";
import { ActionResolutionStepContext } from "../../action-processing/index.js";
import { CombatantProperties } from "../../combatants/index.js";
import { ConsumableType } from "../../items/consumables/index.js";
import {
  EquipmentSlotType,
  HoldableSlotType,
  WearableSlotType,
} from "../../items/equipment/index.js";
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
    self: CombatActionComponent
  ) => null | ActionResourceCosts;
  getConsumableCost: () => null | ConsumableType;
  requiresCombatTurn: (context: ActionResolutionStepContext) => boolean;
}

// in the constructor of the action we pass "this" to the getResourceCosts function in the config
// so we can then call .getResourceCosts without passing an action to it
export interface CombatActionCostProperties extends CombatActionCostPropertiesConfig {
  getResourceCosts: (user: CombatantProperties, inCombat: boolean) => null | ActionResourceCosts;
}

export const genericCombatActionCostProperties: CombatActionCostPropertiesConfig = {
  incursDurabilityLoss: {},
  costBases: {},
  getResourceCosts: () => null,
  getConsumableCost: () => null,
  requiresCombatTurn: () => true,
};

export const BASE_SPELL_MANA_COST_BASES = {
  base: 0.5,
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
  costBases: {
    [ActionPayableResource.QuickActions]: {
      base: 1,
    },
  },
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
