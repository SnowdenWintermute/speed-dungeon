import { CombatActionCostPropertiesConfig } from "../../../combat-action-cost-properties.js";
import { BASIC_ACTION_COST_PROPERTIES_CONFIG } from "./basic-action.js";

export const FAST_ACTION_COST_PROPERTIES_CONFIG: CombatActionCostPropertiesConfig = {
  ...BASIC_ACTION_COST_PROPERTIES_CONFIG,
  getEndsTurnOnUse: () => false,
  requiresCombatTurnInThisContext: () => false,
  getCooldownTurns: () => null,
};
