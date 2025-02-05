import { Vector3 } from "@babylonjs/core";
import {
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionSequenceManager,
  ActionStepTracker,
} from "../../../../action-processing/index.js";
import { AdventuringParty } from "../../../../adventuring-party/index.js";
import { CombatantContext } from "../../../../combatant-context/index.js";
import { CombatAttribute } from "../../../../combatants/attributes/index.js";
import { CombatantProperties } from "../../../../combatants/index.js";
import { ERROR_MESSAGES } from "../../../../errors/index.js";
import { CombatActionTargetType } from "../../../targeting/combat-action-targets.js";
import {
  getStandardActionArmorPenetration,
  getStandardActionCritChance,
  getStandardActionCritMultiplier,
} from "../../action-calculation-utils/standard-action-calculations.js";
import { ActionAccuracy, ActionAccuracyType } from "../../combat-action-accuracy.js";
import { CombatActionRequiredRange } from "../../combat-action-range.js";
import { CombatActionComponent, CombatActionExecutionIntent } from "../../index.js";
import { MELEE_START_ATTACK_RANGE } from "../../../../app-consts.js";
import { PreUsePositioningActionResolutionStep } from "../../../../action-processing/action-steps/pre-use-positioning.js";
import { StartUseAnimationActionResolutionStep } from "../../../../action-processing/action-steps/start-use-animation.js";

export const MELEE_ATTACK_COMMON_CONFIG = {
  getRequiredRange: () => CombatActionRequiredRange.Melee,
  getUnmodifiedAccuracy: function (user: CombatantProperties): ActionAccuracy {
    const userCombatAttributes = CombatantProperties.getTotalAttributes(user);
    return {
      type: ActionAccuracyType.Percentage,
      value: userCombatAttributes[CombatAttribute.Accuracy],
    };
  },
  getCritChance: function (user: CombatantProperties): number {
    return getStandardActionCritChance(user, CombatAttribute.Dexterity);
  },
  getCritMultiplier: function (user: CombatantProperties): number {
    return getStandardActionCritMultiplier(user, CombatAttribute.Strength);
  },
  // could use self to get the armor pen attribute from the action, then can display the armor pen attribute on client
  getArmorPenetration: function (user: CombatantProperties, self: CombatActionComponent): number {
    return getStandardActionArmorPenetration(user, CombatAttribute.Strength);
  },
  getFirstResolutionStep: function (
    combatantContext: CombatantContext,
    actionExecutionIntent: CombatActionExecutionIntent,
    previousTrackerOption: null | ActionStepTracker,
    manager: ActionSequenceManager
  ): Error | ActionResolutionStep {
    const { targets } = actionExecutionIntent;
    if (targets.type !== CombatActionTargetType.Single)
      return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.INVALID_TARGETS_SELECTED);
    const { targetId } = targets;
    const targetResult = AdventuringParty.getCombatant(combatantContext.party, targetId);
    if (targetResult instanceof Error) return targetResult;

    const distance = Vector3.Distance(
      targetResult.combatantProperties.position,
      combatantContext.combatant.combatantProperties.position
    );

    const actionResolutionStepContext: ActionResolutionStepContext = {
      combatantContext,
      actionExecutionIntent,
      manager,
      previousStepOption: null,
    };

    if (distance > MELEE_START_ATTACK_RANGE)
      return new PreUsePositioningActionResolutionStep(actionResolutionStepContext);
    else {
      // @TODO - calculate a forward path toward target
      const destination = Vector3.Zero();
      return new StartUseAnimationActionResolutionStep(actionResolutionStepContext, destination);
    }
  },
};
