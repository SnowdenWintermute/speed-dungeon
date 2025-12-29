import { AutoTargetingScheme } from "../../../../targeting/auto-targeting/index.js";
import { AUTO_TARGETING_FUNCTIONS } from "../../../../targeting/auto-targeting/mapped-functions.js";
import { CombatActionIntent } from "../../../combat-action-intent.js";
import { CombatActionRequiredRange } from "../../../combat-action-range.js";
import { CombatActionTargetingPropertiesConfig } from "../../../combat-action-targeting-properties.js";
import { CombatActionUsabilityContext } from "../../../combat-action-usable-cotexts.js";
import { ProhibitedTargetCombatantStates } from "../../../prohibited-target-combatant-states.js";
import { TargetCategories, TargetingScheme } from "../../../targeting-schemes-and-categories.js";
import {
  ACTION_EXECUTION_PRECONDITIONS,
  ActionExecutionPreconditions,
} from "./action-execution-preconditions.js";

export const SINGLE_HOSTILE_TARGETING_PROPERTIES: CombatActionTargetingPropertiesConfig = {
  getTargetingSchemes: () => [TargetingScheme.Single],
  getValidTargetCategories: () => TargetCategories.Opponent,
  autoTargetSelectionMethod: { scheme: AutoTargetingScheme.UserSelected },
  prohibitedTargetCombatantStates: [ProhibitedTargetCombatantStates.Dead],
  prohibitedHitCombatantStates: [ProhibitedTargetCombatantStates.Dead],
  intent: CombatActionIntent.Malicious,
  usabilityContext: CombatActionUsabilityContext.InCombat,
  getRequiredEquipmentTypeOptions: () => [],
  getRequiredRange: () => CombatActionRequiredRange.Ranged,
  getAutoTarget: (combatantContext, actionTrackerOption, self) => {
    const { scheme } = self.targetingProperties.autoTargetSelectionMethod;
    return AUTO_TARGETING_FUNCTIONS[scheme](combatantContext, self);
  },
  executionPreconditions: [
    ACTION_EXECUTION_PRECONDITIONS[ActionExecutionPreconditions.UserIsAlive],
    ACTION_EXECUTION_PRECONDITIONS[ActionExecutionPreconditions.TargetsAreAlive],
  ],
};

export const SINGLE_FRIENDLY_TARGETING_PROPERTIES: CombatActionTargetingPropertiesConfig = {
  ...SINGLE_HOSTILE_TARGETING_PROPERTIES,
  getValidTargetCategories: () => TargetCategories.Friendly,
  intent: CombatActionIntent.Benevolent,
  usabilityContext: CombatActionUsabilityContext.All,
};

export const SINGLE_ANY_TARGETING_PROPERTIES: CombatActionTargetingPropertiesConfig = {
  ...SINGLE_HOSTILE_TARGETING_PROPERTIES,
  getValidTargetCategories: () => TargetCategories.Any,
  intent: CombatActionIntent.Malicious,
  usabilityContext: CombatActionUsabilityContext.All,
};

export const PET_OF_USER_TARGETING_PROPERTIES: CombatActionTargetingPropertiesConfig = {
  ...SINGLE_FRIENDLY_TARGETING_PROPERTIES,
  prohibitedTargetCombatantStates: [
    ProhibitedTargetCombatantStates.Dead,
    ProhibitedTargetCombatantStates.IsNotThisUsersPet,
  ],
};
