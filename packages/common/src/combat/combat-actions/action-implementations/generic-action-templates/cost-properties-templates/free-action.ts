import { CombatActionCostPropertiesConfig } from "../../../combat-action-cost-properties.js";

export const FREE_ACTION_COST_PROPERTIES_CONFIG: CombatActionCostPropertiesConfig = {
  incursDurabilityLoss: {},
  costsByRank: {},
  getResourceCosts: () => null,
  getConsumableCost: () => null,
  getEndsTurnOnUse: () => false,
  requiresCombatTurnInThisContext: () => false,
  getCooldownTurns: () => null,
};
