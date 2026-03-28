import { TargetCategories, TargetingScheme } from "./targeting-schemes-and-categories.js";
import { ProhibitedTargetCombatantStates } from "./prohibited-target-combatant-states.js";
import { ActionTracker } from "../../action-processing/action-tracker.js";
import { CombatActionComponent } from "./index.js";
import { CombatActionIntent } from "./combat-action-intent.js";
import { CombatActionRequiredRange } from "./combat-action-range.js";
import { IActionUser } from "../../action-user-context/action-user.js";
import { ActionUserContext } from "../../action-user-context/index.js";
import { AutoTargetingSelectionMethod } from "../targeting/auto-targeting/index.js";
import { CombatActionUsabilityContext } from "./combat-action-usable-cotexts.js";
import { EquipmentType } from "../../items/equipment/equipment-types/index.js";
import { CombatActionTarget } from "../targeting/combat-action-targets.js";
import { ActionResolutionStepContext } from "../../action-processing/action-steps/index.js";
import { ActionRank } from "../../aliases.js";

export interface CombatActionTargetingPropertiesConfig {
  getTargetingSchemes: (actionLevel: ActionRank) => TargetingScheme[];
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
  getRequiredEquipmentTypeOptions: (actionLevel: ActionRank) => EquipmentType[];
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
