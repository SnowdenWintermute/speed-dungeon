import { TargetCategories, TargetingScheme } from "./targeting-schemes-and-categories.js";
import {
  AutoTargetingScheme,
  AutoTargetingSelectionMethod,
  CombatActionTarget,
} from "../targeting/index.js";
import { ProhibitedTargetCombatantStates } from "./prohibited-target-combatant-states.js";
import { ActionTracker } from "../../action-processing/action-tracker.js";
import { CombatantContext } from "../../combatant-context/index.js";
import { CombatActionComponent, CombatActionUsabilityContext } from "./index.js";
import { AUTO_TARGETING_FUNCTIONS } from "../targeting/auto-targeting/mapped-functions.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { CombatActionIntent } from "./combat-action-intent.js";
import { Combatant } from "../../combatants/index.js";

export interface CombatActionTargetingPropertiesConfig {
  getTargetingSchemes: (user: Combatant) => TargetingScheme[];
  validTargetCategories: TargetCategories;
  autoTargetSelectionMethod: AutoTargetingSelectionMethod;
  prohibitedTargetCombatantStates: ProhibitedTargetCombatantStates[];
  prohibitedHitCombatantStates: ProhibitedTargetCombatantStates[];
  intent: CombatActionIntent;
  usabilityContext: CombatActionUsabilityContext;
  getAutoTarget: (
    combatantContext: CombatantContext,
    actionTrackerOption: null | ActionTracker,
    self: CombatActionComponent
  ) => Error | null | CombatActionTarget;
}

export interface CombatActionTargetingProperties extends CombatActionTargetingPropertiesConfig {
  getAutoTarget: (
    combatantContext: CombatantContext,
    actionTrackerOption: null | ActionTracker
  ) => Error | null | CombatActionTarget;
}

export enum TargetingPropertiesTypes {
  HostileSingle,
  HostileArea,
  HostileCopyParent,
  FriendlySingle,
}

const hostileSingle: CombatActionTargetingPropertiesConfig = {
  getTargetingSchemes: () => [TargetingScheme.Single],
  validTargetCategories: TargetCategories.Opponent,
  autoTargetSelectionMethod: { scheme: AutoTargetingScheme.UserSelected },
  prohibitedTargetCombatantStates: [ProhibitedTargetCombatantStates.Dead],
  prohibitedHitCombatantStates: [],
  intent: CombatActionIntent.Malicious,
  usabilityContext: CombatActionUsabilityContext.InCombat,

  getAutoTarget: (
    combatantContext: CombatantContext,
    actionTrackerOption: null | ActionTracker,
    self: CombatActionComponent
  ) => {
    const { scheme } = self.targetingProperties.autoTargetSelectionMethod;
    return AUTO_TARGETING_FUNCTIONS[scheme](combatantContext, self);
  },
};

export const GENERIC_TARGETING_PROPERTIES: Record<
  TargetingPropertiesTypes,
  CombatActionTargetingPropertiesConfig
> = {
  [TargetingPropertiesTypes.HostileSingle]: hostileSingle,
  [TargetingPropertiesTypes.HostileArea]: {
    ...hostileSingle,
    getTargetingSchemes: () => [TargetingScheme.Area],
  },
  [TargetingPropertiesTypes.HostileCopyParent]: {
    ...hostileSingle,
    autoTargetSelectionMethod: { scheme: AutoTargetingScheme.CopyParent },

    getAutoTarget(combatantContext, previousTrackerOption, self) {
      if (!previousTrackerOption)
        return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.MISSING_EXPECTED_ACTION_IN_CHAIN);

      return previousTrackerOption.actionExecutionIntent.targets;
    },
  },
  [TargetingPropertiesTypes.FriendlySingle]: {
    ...hostileSingle,
    intent: CombatActionIntent.Benevolent,
    usabilityContext: CombatActionUsabilityContext.All,
    validTargetCategories: TargetCategories.Friendly,
  },
};
