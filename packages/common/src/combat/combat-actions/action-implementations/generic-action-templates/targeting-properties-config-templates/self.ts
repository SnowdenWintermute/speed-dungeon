import { CombatActionTargetingPropertiesConfig } from "../../../combat-action-targeting-properties.js";
import { CombatActionUsabilityContext } from "../../../combat-action-usable-cotexts.js";
import { TargetCategories, TargetingScheme } from "../../../targeting-schemes-and-categories.js";
import { SINGLE_FRIENDLY_TARGETING_PROPERTIES } from "./single.js";

export const SELF_IN_COMBAT_TARGETING_PROPERTIES: CombatActionTargetingPropertiesConfig = {
  ...SINGLE_FRIENDLY_TARGETING_PROPERTIES,
  getTargetingSchemes: () => [TargetingScheme.Single],
  getValidTargetCategories: () => TargetCategories.User,
  usabilityContext: CombatActionUsabilityContext.InCombat,
};

export const SELF_OUT_OF_COMBAT_TARGETING_PROPERTIES: CombatActionTargetingPropertiesConfig = {
  ...SINGLE_FRIENDLY_TARGETING_PROPERTIES,
  getTargetingSchemes: () => [TargetingScheme.Single],
  getValidTargetCategories: () => TargetCategories.User,
  usabilityContext: CombatActionUsabilityContext.OutOfCombat,
};

export const SELF_ANY_TIME_TARGETING_PROPERTIES: CombatActionTargetingPropertiesConfig = {
  ...SINGLE_FRIENDLY_TARGETING_PROPERTIES,
  getTargetingSchemes: () => [TargetingScheme.Single],
  getValidTargetCategories: () => TargetCategories.User,
};
