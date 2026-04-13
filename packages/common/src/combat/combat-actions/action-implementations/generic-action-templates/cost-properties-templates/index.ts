import cloneDeep from "lodash.clonedeep";
import { CombatActionCostPropertiesConfig } from "../../../combat-action-cost-properties.js";
import { FAST_ACTION_COST_PROPERTIES_CONFIG } from "./fast-action.js";
import { BASIC_ACTION_COST_PROPERTIES_CONFIG } from "./basic-action.js";
import { BASIC_SPELL_COST_PROPERTIES_CONFIG } from "./basic-spell.js";
import { FAST_SPELL_COST_PROPERTIES_CONFIG } from "./fast-spell.js";
import {
  BASIC_MELEE_MAIN_HAND_ATTACK_COST_PROPERTIES_CONFIG,
  BASIC_MELEE_OFFHAND_ATTACK_COST_PROPERTIES_CONFIG,
  BASIC_RANGED_MAIN_HAND_ATTACK_COST_PROPERTIES_CONFIG,
} from "./basic-attacks.js";
import { FREE_ACTION_COST_PROPERTIES_CONFIG } from "./free-action.js";
import { EquipmentSlotType } from "../../../../../items/equipment/slots.js";
import {
  ActionResourceCostBases,
  ActionResourceCostBasesOverride,
} from "../../../action-calculation-utils/action-costs.js";

export const COST_PROPERTIES_TEMPLATE_GETTERS = {
  BASIC_ACTION: () => cloneDeep(BASIC_ACTION_COST_PROPERTIES_CONFIG),
  FAST_ACTION: () => cloneDeep(FAST_ACTION_COST_PROPERTIES_CONFIG),
  BASIC_SPELL: () => cloneDeep(BASIC_SPELL_COST_PROPERTIES_CONFIG),
  FAST_SPELL: () => cloneDeep(FAST_SPELL_COST_PROPERTIES_CONFIG),
  BASIC_MELEE_MAIN_HAND_ATTACK: () =>
    cloneDeep(BASIC_MELEE_MAIN_HAND_ATTACK_COST_PROPERTIES_CONFIG),
  BASIC_MELEE_OFF_HAND_ATTACK: () => cloneDeep(BASIC_MELEE_OFFHAND_ATTACK_COST_PROPERTIES_CONFIG),
  BASIC_RANGED_MAIN_HAND_ATTACK: () =>
    cloneDeep(BASIC_RANGED_MAIN_HAND_ATTACK_COST_PROPERTIES_CONFIG),
  FREE_ACTION: () => cloneDeep(FREE_ACTION_COST_PROPERTIES_CONFIG),
};

export type CostPropertiesOverrides = Omit<Partial<CombatActionCostPropertiesConfig>, "costBases"> & {
  costBases?: ActionResourceCostBasesOverride;
};

function mergeCostBases(
  base: ActionResourceCostBases,
  overrides: ActionResourceCostBasesOverride
): ActionResourceCostBases {
  const merged = { ...base, ...overrides };
  const result: ActionResourceCostBases = {};
  for (const [key, value] of Object.entries(merged)) {
    if (value != null) {
      result[key as unknown as keyof ActionResourceCostBases] = value;
    }
  }
  return result;
}

export function createCostPropertiesConfig(
  templateGetter: () => CombatActionCostPropertiesConfig,
  overrides: CostPropertiesOverrides
): CombatActionCostPropertiesConfig {
  const base = templateGetter();

  return {
    ...base,
    ...overrides,
    incursDurabilityLoss: {
      [EquipmentSlotType.Wearable]: {
        ...base.incursDurabilityLoss[EquipmentSlotType.Wearable],
        ...overrides.incursDurabilityLoss?.[EquipmentSlotType.Wearable],
      },
      [EquipmentSlotType.Holdable]: {
        ...base.incursDurabilityLoss[EquipmentSlotType.Holdable],
        ...overrides.incursDurabilityLoss?.[EquipmentSlotType.Holdable],
      },
    },
    costBases: overrides.costBases
      ? mergeCostBases(base.costBases, overrides.costBases)
      : base.costBases,
  };
}
