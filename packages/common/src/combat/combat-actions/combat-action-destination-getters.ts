import { Vector3 } from "@babylonjs/core";
import { ActionResolutionStepContext } from "../../action-processing/index.js";
import { TargetingCalculator } from "../targeting/targeting-calculator.js";
import { getLookRotationFromPositions } from "../../utils/index.js";

const meleeRange = 1.5;
const threshold = 0.01;

export function getMeleeAttackDestination(context: ActionResolutionStepContext) {
  {
    const { actionUserContext, tracker } = context;
    const { actionExecutionIntent } = tracker;
    const targetingCalculator = new TargetingCalculator(actionUserContext, null);
    const primaryTargetResult = targetingCalculator.getPrimaryTargetCombatant(
      actionUserContext.party,
      actionExecutionIntent
    );
    if (primaryTargetResult instanceof Error) return primaryTargetResult;
    const target = primaryTargetResult;

    const { actionUser } = actionUserContext;

    const userPositionOption = actionUser.getPositionOption();
    if (userPositionOption === null) throw new Error("expected position");
    const userPosition = userPositionOption;

    const targetTransformProperties = target.combatantProperties.transformProperties;

    const distance = Vector3.Distance(targetTransformProperties.position, userPosition);
    if (distance <= meleeRange || isNaN(distance) || Math.abs(meleeRange - distance) < threshold) {
      return { position: userPosition.clone() };
    }

    const homePosition = actionUser.getHomePosition();

    const direction = targetTransformProperties.homePosition.subtract(homePosition).normalize();

    const destination = targetTransformProperties.homePosition.subtract(
      direction.scale(meleeRange)
    );

    const destinationRotation = getLookRotationFromPositions(
      homePosition,
      targetTransformProperties.homePosition
    );

    return {
      position: destination,
      rotation: destinationRotation,
    };
  }
}
