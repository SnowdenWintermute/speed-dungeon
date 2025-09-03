import cloneDeep from "lodash.clonedeep";
import { CombatActionTargetingPropertiesConfig } from "../../../combat-action-targeting-properties.js";
import {
  SINGLE_FRIENDLY_TARGETING_PROPERTIES,
  SINGLE_HOSTILE_TARGETING_PROPERTIES,
} from "./single.js";
import { AREA_FRIENDLY_TARGETING_PROPERTIES, AREA_HOSTILE_TARGETING_PROPERTIES } from "./area.js";
import { COPY_PARENT_HOSTILE_TARGETING_PROPERTIES } from "./copy-parent.js";

export const TARGETING_PROPERTIES_TEMPLATE_GETTERS = {
  SINGLE_HOSTILE: () => cloneDeep(SINGLE_HOSTILE_TARGETING_PROPERTIES),
  FRIENDLY_HOSTILE: () => cloneDeep(SINGLE_FRIENDLY_TARGETING_PROPERTIES),
  AREA_HOSTILE: () => cloneDeep(AREA_HOSTILE_TARGETING_PROPERTIES),
  AREA_FRIENDLY: () => cloneDeep(AREA_FRIENDLY_TARGETING_PROPERTIES),
  COPY_PARENT_HOSTILE: () => cloneDeep(COPY_PARENT_HOSTILE_TARGETING_PROPERTIES),
};

export function createTargetingPropertiesConfig(
  templateGetter: () => CombatActionTargetingPropertiesConfig,
  overrides: Partial<CombatActionTargetingPropertiesConfig>
): CombatActionTargetingPropertiesConfig {
  const base = templateGetter();

  return {
    ...base,
    ...overrides,
  };
}
