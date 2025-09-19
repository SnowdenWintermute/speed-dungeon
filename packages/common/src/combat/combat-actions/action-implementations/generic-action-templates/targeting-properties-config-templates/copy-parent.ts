import { ERROR_MESSAGES } from "../../../../../errors/index.js";
import { AutoTargetingScheme } from "../../../../targeting/index.js";
import { CombatActionTargetingPropertiesConfig } from "../../../combat-action-targeting-properties.js";
import { SINGLE_HOSTILE_TARGETING_PROPERTIES } from "./single.js";

export const COPY_PARENT_HOSTILE_TARGETING_PROPERTIES: CombatActionTargetingPropertiesConfig = {
  ...SINGLE_HOSTILE_TARGETING_PROPERTIES,
  autoTargetSelectionMethod: { scheme: AutoTargetingScheme.CopyParent },
  getAutoTarget(combatantContext, previousTrackerOption, self) {
    const errorMessage = ERROR_MESSAGES.COMBAT_ACTIONS.MISSING_EXPECTED_ACTION_IN_CHAIN;
    if (!previousTrackerOption) return new Error(errorMessage);
    return previousTrackerOption.actionExecutionIntent.targets;
  },
};
