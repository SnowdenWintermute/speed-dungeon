import { Vector3 } from "@babylonjs/core";
import {
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
  ActionSequenceManager,
  ActionStepTracker,
  CombatantPositioningActionResolutionStep,
} from "../../../action-processing/index.js";
import { AdventuringParty } from "../../../adventuring-party/index.js";
import { CombatantContext } from "../../../combatant-context/index.js";
import { CombatAttribute } from "../../../combatants/attributes/index.js";
import { CombatantProperties } from "../../../combatants/index.js";
import { ERROR_MESSAGES } from "../../../errors/index.js";
import { CombatActionTargetType } from "../../targeting/combat-action-targets.js";
import {
  getStandardActionArmorPenetration,
  getStandardActionCritChance,
  getStandardActionCritMultiplier,
} from "../action-calculation-utils/standard-action-calculations.js";
import { ActionAccuracy, ActionAccuracyType } from "../combat-action-accuracy.js";
import { CombatActionRequiredRange } from "../combat-action-range.js";
import { CombatActionComponent, CombatActionExecutionIntent } from "../../index.js";
import { AnimationName, MELEE_START_ATTACK_RANGE } from "../../../app-consts.js";
import { StartUseAnimationActionResolutionStep } from "../../../action-processing/action-steps/start-use-animation.js";
import { TargetingCalculator } from "../../targeting/targeting-calculator.js";

export const MELEE_ATTACK_COMMON_CONFIG = {
  userShouldMoveHomeOnComplete: true,
  getRequiredRange: () => CombatActionRequiredRange.Melee,
  getPositionToStartUse: (
    combatantContext: CombatantContext,
    actionExecutionIntent: CombatActionExecutionIntent,
    self: CombatActionComponent
  ) => {
    const targetingCalculator = new TargetingCalculator(combatantContext, null);
    const targetIdsResult = targetingCalculator.getCombatActionTargetIds(
      self,
      actionExecutionIntent.targets
    );
    if (targetIdsResult instanceof Error) return targetIdsResult;
    const primaryTargetIdOption = targetIdsResult[0];
    if (primaryTargetIdOption === undefined)
      return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NO_TARGET_PROVIDED);
    const primaryTargetResult = AdventuringParty.getCombatant(
      combatantContext.party,
      primaryTargetIdOption
    );
    if (primaryTargetResult instanceof Error) return primaryTargetResult;
    const target = primaryTargetResult.combatantProperties;
    const user = combatantContext.combatant.combatantProperties;

    const meleeRange = 1.5;
    const threshold = 0.01;
    const distance = Vector3.Distance(target.position, user.position);
    if (distance <= meleeRange || isNaN(distance) || Math.abs(meleeRange - distance) < threshold) {
      return user.position.clone();
    }

    const direction = target.homeLocation
      .subtract(combatantContext.combatant.combatantProperties.homeLocation)
      .normalize();

    return target.homeLocation.subtract(direction.scale(target.hitboxRadius + user.hitboxRadius));
  },
  getDestinationDuringDelivery: (
    combatantContext: CombatantContext,
    actionExecutionIntent: CombatActionExecutionIntent,
    self: CombatActionComponent
  ) => {
    const targetingCalculator = new TargetingCalculator(combatantContext, null);
    const targetIdsResult = targetingCalculator.getCombatActionTargetIds(
      self,
      actionExecutionIntent.targets
    );
    if (targetIdsResult instanceof Error) return targetIdsResult;
    const primaryTargetIdOption = targetIdsResult[0];
    if (primaryTargetIdOption === undefined)
      return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NO_TARGET_PROVIDED);
    const primaryTargetResult = AdventuringParty.getCombatant(
      combatantContext.party,
      primaryTargetIdOption
    );
    if (primaryTargetResult instanceof Error) return primaryTargetResult;
    const target = primaryTargetResult.combatantProperties;
    const user = combatantContext.combatant.combatantProperties;

    const meleeRange = 1.5;
    const distance = Vector3.Distance(target.position, user.position);
    if (distance <= meleeRange || isNaN(distance)) {
      return user.position.clone();
    }

    const toTravel = distance - meleeRange;

    const direction = target.position
      .subtract(combatantContext.combatant.combatantProperties.position)
      .normalize();

    return user.position.add(direction.scale(toTravel));
  },
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
      return new CombatantPositioningActionResolutionStep(
        actionResolutionStepContext,
        AnimationName.MoveForward,
        ActionResolutionStepType.preUsePositioning
      );
    else {
      // @TODO - calculate a forward path toward target
      const destination = Vector3.Zero();
      return new StartUseAnimationActionResolutionStep(actionResolutionStepContext, destination);
    }
  },
};
