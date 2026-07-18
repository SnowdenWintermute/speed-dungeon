import { ActionPayableResource } from "../../../action-calculation-utils/action-costs.js";
import { CombatActionCostPropertiesConfig } from "../../../combat-action-cost-properties.js";

export const BASE_SPELL_MANA_COST_BASES = {
  base: 0.25,
  multipliers: {
    actionLevel: 1.1,
    userCombatantLevel: 0.75,
  },
  additives: {
    actionLevel: 2,
    userCombatantLevel: 0,
  },
};

export const SPELL_COMMON_COST_PROPERTIES: Partial<CombatActionCostPropertiesConfig> = {
  costBases: {
    [ActionPayableResource.Mana]: BASE_SPELL_MANA_COST_BASES,
  },
};
