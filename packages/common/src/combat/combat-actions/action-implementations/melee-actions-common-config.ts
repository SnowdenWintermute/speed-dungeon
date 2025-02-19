import { Vector3 } from "@babylonjs/core";
import {
  ActionMotionPhase,
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "../../../action-processing/index.js";
import { AdventuringParty } from "../../../adventuring-party/index.js";
import { CombatantContext } from "../../../combatant-context/index.js";
import { CombatAttribute } from "../../../combatants/attributes/index.js";
import { CombatantProperties } from "../../../combatants/index.js";
import { ERROR_MESSAGES } from "../../../errors/index.js";
import {
  getStandardActionArmorPenetration,
  getStandardActionCritChance,
  getStandardActionCritMultiplier,
} from "../action-calculation-utils/standard-action-calculations.js";
import { ActionAccuracy, ActionAccuracyType } from "../combat-action-accuracy.js";
import { CombatActionRequiredRange } from "../combat-action-range.js";
import { COMBAT_ACTIONS, CombatActionComponent, CombatActionExecutionIntent } from "../../index.js";
import { TargetingCalculator } from "../../targeting/targeting-calculator.js";
import { COMMON_DESTINATION_GETTERS } from "./common-destination-getters.js";

const meleeRange = 1.5;
const threshold = 0.01;

export const MELEE_ATTACK_COMMON_CONFIG = {
  userShouldMoveHomeOnComplete: true,
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
  getResolutionSteps() {
    return [
      ActionResolutionStepType.InitialPositioning,
      ActionResolutionStepType.DeliveryMotion,
      ActionResolutionStepType.PayResourceCosts,
      ActionResolutionStepType.EvalOnUseTriggers,
      ActionResolutionStepType.RollIncomingHitOutcomes,
      ActionResolutionStepType.EvalOnHitOutcomeTriggers,
      ActionResolutionStepType.RecoveryMotion,
    ];
  },
  motionPhasePositionGetters: {
    ...COMMON_DESTINATION_GETTERS,
    [ActionMotionPhase.Initial]: (context: ActionResolutionStepContext) => {
      const { combatantContext, tracker } = context;
      const { actionExecutionIntent } = tracker;
      const targetingCalculator = new TargetingCalculator(combatantContext, null);
      const primaryTargetResult = targetingCalculator.getPrimaryTargetCombatant(
        combatantContext.party,
        actionExecutionIntent
      );
      if (primaryTargetResult instanceof Error) return primaryTargetResult;
      const target = primaryTargetResult;
      const user = combatantContext.combatant.combatantProperties;

      const distance = Vector3.Distance(target.position, user.position);
      if (
        distance <= meleeRange ||
        isNaN(distance) ||
        Math.abs(meleeRange - distance) < threshold
      ) {
        return user.position.clone();
      }

      const direction = target.homeLocation
        .subtract(combatantContext.combatant.combatantProperties.homeLocation)
        .normalize();

      return target.homeLocation.subtract(direction.scale(target.hitboxRadius + user.hitboxRadius));
    },
    [ActionMotionPhase.Delivery]: (context: ActionResolutionStepContext) => {
      const { combatantContext, tracker } = context;
      const { actionExecutionIntent } = tracker;
      const targetingCalculator = new TargetingCalculator(combatantContext, null);
      const primaryTargetResult = targetingCalculator.getPrimaryTargetCombatant(
        combatantContext.party,
        actionExecutionIntent
      );
      if (primaryTargetResult instanceof Error) return primaryTargetResult;
      const target = primaryTargetResult;
      const user = combatantContext.combatant.combatantProperties;

      const distance = Vector3.Distance(target.position, user.position);
      if (
        distance <= meleeRange ||
        isNaN(distance) ||
        Math.abs(meleeRange - distance) < threshold
      ) {
        return user.position.clone();
      }

      const toTravel = distance - meleeRange;

      const direction = target.position
        .subtract(combatantContext.combatant.combatantProperties.position)
        .normalize();

      return user.position.add(direction.scale(toTravel));
    },
  },
};
