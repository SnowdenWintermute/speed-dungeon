import { CombatActionIntent } from "../../../combat-action-intent.js";
import { CombatActionTargetingPropertiesConfig } from "../../../combat-action-targeting-properties.js";
import { TargetCategories, TargetingScheme } from "../../../targeting-schemes-and-categories.js";
import { SINGLE_FRIENDLY_TARGETING_PROPERTIES } from "./single.js";
import { SINGLE_HOSTILE_TARGETING_PROPERTIES } from "./single.js";

export const AREA_HOSTILE_TARGETING_PROPERTIES: CombatActionTargetingPropertiesConfig = {
  ...SINGLE_HOSTILE_TARGETING_PROPERTIES,
  getTargetingSchemes: () => [TargetingScheme.Area],
};

export const AREA_FRIENDLY_TARGETING_PROPERTIES: CombatActionTargetingPropertiesConfig = {
  ...SINGLE_FRIENDLY_TARGETING_PROPERTIES,
  getTargetingSchemes: () => [TargetingScheme.Area],
};

export const AREA_ANY_TARGETING_PROPERTIES: CombatActionTargetingPropertiesConfig = {
  ...SINGLE_FRIENDLY_TARGETING_PROPERTIES,
  intent: CombatActionIntent.Malicious,
  getTargetingSchemes: () => [TargetingScheme.Area],
  getValidTargetCategories: () => TargetCategories.Any,
};
