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

export interface CombatActionCostProperties {
  incursDurabilityLoss: {
    [EquipmentSlotType.Wearable]?: Partial<Record<WearableSlotType, DurabilityLossCondition>>;
    [EquipmentSlotType.Holdable]?: Partial<Record<HoldableSlotType, DurabilityLossCondition>>;
  };
  costBases: ActionResourceCostBases;
  getResourceCosts: (
    user: CombatantProperties,
    // self is optional because the action class's cost properties shares a type
    // with this config interface. the action will provide itself in its constructor to this function
    // so we won't need to pass it when calling this function on the class
    self?: CombatActionComponent
  ) => null | ActionResourceCosts;
  getConsumableCost: () => null | ConsumableType;
  requiresCombatTurn: (context: ActionResolutionStepContext) => boolean;
}

const genericCombatActionCostProperties: CombatActionCostProperties = {
  incursDurabilityLoss: {},
  costBases: {},
  getResourceCosts: () => null,
  requiresCombatTurn: () => true,
  getConsumableCost: () => null,
};

const genericSpellCostProperties: CombatActionCostProperties = {
  ...genericCombatActionCostProperties,
  getResourceCosts: getStandardActionCost,
  costBases: {
    [ActionPayableResource.Mana]: {
      base: 3,
      multipliers: {
        actionLevel: 1.2,
        userCombatantLevel: 1.2,
      },
      additives: {
        actionLevel: 1,
        userCombatantLevel: 1,
      },
    },
  },
};

const genericMedicationCostProperties: CombatActionCostProperties = {
  ...genericCombatActionCostProperties,
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
  CombatActionCostProperties
> = {
  [ActionCostPropertiesBaseTypes.Base]: genericCombatActionCostProperties,
  [ActionCostPropertiesBaseTypes.Spell]: genericSpellCostProperties,
  [ActionCostPropertiesBaseTypes.Medication]: genericMedicationCostProperties,
};
