import { TargetCategories, TargetingScheme } from "./targeting-schemes-and-categories.js";
import { AutoTargetingSelectionMethod, CombatActionTarget } from "../targeting/index.js";
import { ProhibitedTargetCombatantStates } from "./prohibited-target-combatant-states.js";
import { ActionTracker } from "../../action-processing/action-tracker.js";
import { CombatantContext } from "../../combatant-context/index.js";
import { CombatActionComponent, CombatActionUsabilityContext } from "./index.js";
import { CombatActionIntent } from "./combat-action-intent.js";
import { EquipmentType } from "../../items/equipment/index.js";
import { CombatantProperties } from "../../combatants/index.js";
import { CombatActionRequiredRange } from "./combat-action-range.js";

export interface CombatActionTargetingPropertiesConfig {
  getTargetingSchemes: (actionLevel: number) => TargetingScheme[];
  getValidTargetCategories: (actionLevel: number) => TargetCategories;
  /** Some actions are not targeted by the user and must automatically choose, such as projeciles and triggered explosions. */
  autoTargetSelectionMethod: AutoTargetingSelectionMethod;
  /** Example: don't allow attacking a dead target */
  prohibitedTargetCombatantStates: ProhibitedTargetCombatantStates[];
  /** Used when an action has already be used and we need to separately determine if it should hit the target */
  prohibitedHitCombatantStates: ProhibitedTargetCombatantStates[];
  /** Used for determining if a target should attempt mitigation */
  intent: CombatActionIntent;
  usabilityContext: CombatActionUsabilityContext;
  getRequiredEquipmentTypeOptions: (actionLevel: number) => EquipmentType[];
  getAutoTarget: (
    combatantContext: CombatantContext,
    actionTrackerOption: null | ActionTracker,
    self: CombatActionComponent
  ) => Error | null | CombatActionTarget;
  getRequiredRange: (
    user: CombatantProperties,
    self: CombatActionComponent
  ) => CombatActionRequiredRange;
  shouldExecute: (
    combatantContext: CombatantContext,
    previousTrackerOption: undefined | ActionTracker,
    self: CombatActionComponent
  ) => boolean;
}

export interface CombatActionTargetingProperties extends CombatActionTargetingPropertiesConfig {
  getAutoTarget: (
    combatantContext: CombatantContext,
    actionTrackerOption: null | ActionTracker
  ) => Error | null | CombatActionTarget;
}
