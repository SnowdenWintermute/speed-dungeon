import { CombatActionCostPropertiesConfig } from "../../../combat-action-cost-properties.js";
import { FAST_ACTION_COST_PROPERTIES_CONFIG } from "./fast-action.js";
import { SPELL_COMMON_COST_PROPERTIES } from "./spell-common-costs.js";

export const FAST_SPELL_COST_PROPERTIES_CONFIG: CombatActionCostPropertiesConfig = {
  ...FAST_ACTION_COST_PROPERTIES_CONFIG,
  costBases: {
    ...FAST_ACTION_COST_PROPERTIES_CONFIG.costBases,
    ...SPELL_COMMON_COST_PROPERTIES.costBases,
  },
};
