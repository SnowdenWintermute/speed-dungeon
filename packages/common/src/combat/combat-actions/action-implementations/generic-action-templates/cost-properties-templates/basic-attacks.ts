import { EquipmentSlotType, HoldableSlotType } from "../../../../../items/equipment/slots.js";
import { CombatActionCostPropertiesConfig } from "../../../combat-action-cost-properties.js";
import { DurabilityLossCondition } from "../../../combat-action-durability-loss-condition.js";
import { BASIC_ACTION_COST_PROPERTIES_CONFIG } from "./basic-action.js";

export const BASIC_MELEE_MAIN_HAND_ATTACK_COST_PROPERTIES_CONFIG: CombatActionCostPropertiesConfig =
  {
    ...BASIC_ACTION_COST_PROPERTIES_CONFIG,
    incursDurabilityLoss: {
      [EquipmentSlotType.Holdable]: { [HoldableSlotType.MainHand]: DurabilityLossCondition.OnHit },
    },
  };

export const BASIC_MELEE_OFFHAND_ATTACK_COST_PROPERTIES_CONFIG: CombatActionCostPropertiesConfig = {
  ...BASIC_ACTION_COST_PROPERTIES_CONFIG,
  getEndsTurnOnUse: () => true,
  requiresCombatTurnInThisContext: () => true,
  incursDurabilityLoss: {
    [EquipmentSlotType.Holdable]: { [HoldableSlotType.OffHand]: DurabilityLossCondition.OnHit },
  },
};

export const BASIC_RANGED_MAIN_HAND_ATTACK_COST_PROPERTIES_CONFIG: CombatActionCostPropertiesConfig =
  {
    ...BASIC_ACTION_COST_PROPERTIES_CONFIG,
    incursDurabilityLoss: {
      [EquipmentSlotType.Holdable]: { [HoldableSlotType.MainHand]: DurabilityLossCondition.OnUse },
    },
  };
