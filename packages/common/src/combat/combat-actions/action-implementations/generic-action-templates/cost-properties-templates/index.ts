import cloneDeep from "lodash.clonedeep";
import { CombatActionCostPropertiesConfig } from "../../../combat-action-cost-properties.js";
import { EquipmentSlotType } from "../../../../../items/equipment/index.js";
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

export function createCostPropertiesConfig(
  templateGetter: () => CombatActionCostPropertiesConfig,
  overrides: Partial<CombatActionCostPropertiesConfig>
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
    costBases: {
      ...base.costBases,
      ...overrides.costBases,
    },
  };
}
