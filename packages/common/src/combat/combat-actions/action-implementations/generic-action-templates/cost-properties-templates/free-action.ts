import { CombatActionCostPropertiesConfig } from "../../../combat-action-cost-properties.js";

export const FREE_ACTION_COST_PROPERTIES_CONFIG: CombatActionCostPropertiesConfig = {
  incursDurabilityLoss: {},
  costBases: {},
  getResourceCosts: () => null,
  getConsumableCost: () => null,
  getEndsTurnOnUse: () => false,
  requiresCombatTurnInThisContext: () => false,
  getCooldownTurns: () => null,
};
