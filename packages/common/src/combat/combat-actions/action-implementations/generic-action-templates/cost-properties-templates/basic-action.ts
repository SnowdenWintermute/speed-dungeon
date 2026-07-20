import { CombatActionCostPropertiesConfig } from "../../../combat-action-cost-properties.js";
import { getStandardActionCost } from "./get-standard-action-cost.js";

export const BASIC_ACTION_COST_PROPERTIES_CONFIG: CombatActionCostPropertiesConfig = {
  incursDurabilityLoss: {},
  costsByRank: {},
  getResourceCosts: getStandardActionCost,
  getConsumableCost: () => null,
  getEndsTurnOnUse: () => true,
  requiresCombatTurnInThisContext: () => true,
  getCooldownTurns: () => null,
};
