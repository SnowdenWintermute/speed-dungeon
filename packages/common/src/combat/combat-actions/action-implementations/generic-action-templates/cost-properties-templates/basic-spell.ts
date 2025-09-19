import { CombatActionCostPropertiesConfig } from "../../../combat-action-cost-properties.js";
import { BASIC_ACTION_COST_PROPERTIES_CONFIG } from "./basic-action.js";
import { SPELL_COMMON_COST_PROPERTIES } from "./spell-common-costs.js";

export const BASIC_SPELL_COST_PROPERTIES_CONFIG: CombatActionCostPropertiesConfig = {
  ...BASIC_ACTION_COST_PROPERTIES_CONFIG,
  costBases: {
    ...BASIC_ACTION_COST_PROPERTIES_CONFIG.costBases,
    ...SPELL_COMMON_COST_PROPERTIES.costBases,
  },
};
