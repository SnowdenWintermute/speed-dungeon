import { TargetCategories, TargetingScheme } from "./targeting-schemes-and-categories.js";
import { AutoTargetingSelectionMethod, CombatActionTarget } from "../targeting/index.js";
import { ProhibitedTargetCombatantStates } from "./prohibited-target-combatant-states.js";
import { ActionTracker } from "../../action-processing/action-tracker.js";
import { CombatActionComponent, CombatActionUsabilityContext } from "./index.js";
import { CombatActionIntent } from "./combat-action-intent.js";
import { EquipmentType } from "../../items/equipment/index.js";
import { CombatActionRequiredRange } from "./combat-action-range.js";
import { ActionResolutionStepContext } from "../../action-processing/index.js";
import { ActionUserContext, IActionUser } from "../../combatant-context/action-user.js";

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
    actionUserContext: ActionUserContext,
    actionTrackerOption: null | ActionTracker,
    self: CombatActionComponent
  ) => Error | null | CombatActionTarget;
  getRequiredRange: (user: IActionUser, self: CombatActionComponent) => CombatActionRequiredRange;
  executionPreconditions: ActionExecutionPrecondition[];
}

export type ActionExecutionPrecondition = (
  context: ActionResolutionStepContext,
  previousTrackerOption: undefined | ActionTracker,
  self: CombatActionComponent
) => boolean;

export interface CombatActionTargetingProperties extends CombatActionTargetingPropertiesConfig {
  getAutoTarget: (
    actionUserContext: ActionUserContext,
    actionTrackerOption: null | ActionTracker
  ) => Error | null | CombatActionTarget;
}
