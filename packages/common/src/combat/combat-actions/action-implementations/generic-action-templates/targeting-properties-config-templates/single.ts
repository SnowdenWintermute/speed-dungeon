import { ActionTracker } from "../../../../../action-processing/action-tracker.js";
import { CombatantContext } from "../../../../../combatant-context/index.js";
import { SpeedDungeonGame } from "../../../../../game/index.js";
import { AUTO_TARGETING_FUNCTIONS } from "../../../../targeting/auto-targeting/mapped-functions.js";
import { AutoTargetingScheme } from "../../../../targeting/index.js";
import { TargetingCalculator } from "../../../../targeting/targeting-calculator.js";
import { CombatActionIntent } from "../../../combat-action-intent.js";
import { CombatActionRequiredRange } from "../../../combat-action-range.js";
import { CombatActionTargetingPropertiesConfig } from "../../../combat-action-targeting-properties.js";
import { CombatActionUsabilityContext } from "../../../combat-action-usable-cotexts.js";
import { ActionPayableResource, CombatActionComponent } from "../../../index.js";
import { ProhibitedTargetCombatantStates } from "../../../prohibited-target-combatant-states.js";
import { TargetCategories, TargetingScheme } from "../../../targeting-schemes-and-categories.js";

export const SINGLE_HOSTILE_TARGETING_PROPERTIES: CombatActionTargetingPropertiesConfig = {
  getTargetingSchemes: () => [TargetingScheme.Single],
  getValidTargetCategories: () => TargetCategories.Opponent,
  autoTargetSelectionMethod: { scheme: AutoTargetingScheme.UserSelected },
  prohibitedTargetCombatantStates: [ProhibitedTargetCombatantStates.Dead],
  prohibitedHitCombatantStates: [],
  intent: CombatActionIntent.Malicious,
  usabilityContext: CombatActionUsabilityContext.InCombat,
  getRequiredEquipmentTypeOptions: () => [],
  getRequiredRange: () => CombatActionRequiredRange.Ranged,
  getAutoTarget: (combatantContext, actionTrackerOption, self) => {
    const { scheme } = self.targetingProperties.autoTargetSelectionMethod;
    return AUTO_TARGETING_FUNCTIONS[scheme](combatantContext, self);
  },
  shouldExecute,
};

export const SINGLE_FRIENDLY_TARGETING_PROPERTIES: CombatActionTargetingPropertiesConfig = {
  ...SINGLE_HOSTILE_TARGETING_PROPERTIES,
  getValidTargetCategories: () => TargetCategories.Friendly,
  intent: CombatActionIntent.Benevolent,
  usabilityContext: CombatActionUsabilityContext.All,
};

function shouldExecute(
  combatantContext: CombatantContext,
  previousTrackerOption: undefined | ActionTracker,
  self: CombatActionComponent
) {
  const { game, party, combatant } = combatantContext;
  const { combatantProperties } = combatant;

  const isInCombat = party.battleId !== null;

  // @TODO - actually select the action level
  const actionPointCost =
    self.costProperties.getResourceCosts(combatantProperties, isInCombat, 1)?.[
      ActionPayableResource.ActionPoints
    ] ?? 0;
  const { actionPoints } = combatantContext.combatant.combatantProperties;
  if (actionPoints < Math.abs(actionPointCost)) return false;

  const targetsOption = combatant.combatantProperties.combatActionTarget;
  if (!targetsOption) return false;

  const targetingCalculator = new TargetingCalculator(
    new CombatantContext(game, party, combatant),
    null
  );

  const targetIdsResult = targetingCalculator.getCombatActionTargetIds(self, targetsOption);
  if (targetIdsResult instanceof Error) {
    console.trace(targetIdsResult);
    return false;
  }

  if (targetIdsResult.length === 0) return false;

  // if previous was countered, don't continue the queued action sequence
  if (previousTrackerOption) {
    const wasCountered = previousTrackerOption.wasCountered();
    if (wasCountered) return false;
  }

  return !SpeedDungeonGame.allCombatantsInGroupAreDead(game, targetIdsResult);
}
