import { EquipmentSlotId } from "../../../../../combatants/combatant-equipment/types.js";
import { ActionPayableResource } from "../../../action-calculation-utils/action-costs.js";
import { CombatActionCostPropertiesConfig } from "../../../combat-action-cost-properties.js";
import { DurabilityLossCondition } from "../../../combat-action-durability-loss-condition.js";
import { BASIC_ACTION_COST_PROPERTIES_CONFIG } from "./basic-action.js";

export const BASIC_MELEE_MAIN_HAND_ATTACK_COST_PROPERTIES_CONFIG: CombatActionCostPropertiesConfig =
  {
    ...BASIC_ACTION_COST_PROPERTIES_CONFIG,
    incursDurabilityLoss: { [EquipmentSlotId.MainHand]: DurabilityLossCondition.OnHit },
    costsByRank: { [1]: { [ActionPayableResource.ActionPoints]: 1 } },
  };

export const BASIC_MELEE_OFFHAND_ATTACK_COST_PROPERTIES_CONFIG: CombatActionCostPropertiesConfig = {
  ...BASIC_ACTION_COST_PROPERTIES_CONFIG,
  getEndsTurnOnUse: () => true,
  requiresCombatTurnInThisContext: () => true,
  incursDurabilityLoss: { [EquipmentSlotId.OffHand]: DurabilityLossCondition.OnHit },
  costsByRank: { [1]: { [ActionPayableResource.ActionPoints]: 1 } },
};

export const BASIC_RANGED_MAIN_HAND_ATTACK_COST_PROPERTIES_CONFIG: CombatActionCostPropertiesConfig =
  {
    ...BASIC_ACTION_COST_PROPERTIES_CONFIG,
    incursDurabilityLoss: { [EquipmentSlotId.MainHand]: DurabilityLossCondition.OnUse },
    costsByRank: { [1]: { [ActionPayableResource.ActionPoints]: 1 } },
  };
