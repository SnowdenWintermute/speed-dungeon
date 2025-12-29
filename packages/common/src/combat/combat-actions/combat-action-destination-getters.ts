import { Quaternion, Vector3 } from "@babylonjs/core";
import { TargetingCalculator } from "../targeting/targeting-calculator.js";
import { getLookRotationFromPositions } from "../../utils/index.js";
import { ActionResolutionStepContext } from "../../action-processing/action-steps/index.js";

const meleeRange = 1.5;
const threshold = 0.01;

export function getMeleeAttackDestination(context: ActionResolutionStepContext) {
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

  const isRestrained = actionUser.movementIsRestrained();

  if (isRestrained) {
    return null;
  }

  const userPositionOption = actionUser.getPositionOption();
  if (userPositionOption === null) {
    throw new Error("expected position");
  }
  const userPosition = userPositionOption;

  const targetTransformProperties = target.combatantProperties.transformProperties;

  const distance = Vector3.Distance(targetTransformProperties.position, userPosition);
  if (distance <= meleeRange || isNaN(distance) || Math.abs(meleeRange - distance) < threshold) {
    return { position: userPosition.clone() };
  }

  const homePosition = actionUser.getHomePosition();

  let destination;
  let destinationRotation: Quaternion | undefined;

  let direction = targetTransformProperties.getHomePosition().subtract(homePosition).normalize();
  destination = targetTransformProperties.getHomePosition().subtract(direction.scale(meleeRange));

  const shouldFlyTowardsTarget = !actionUser.targetFlyingConditionPreventsReachingMeleeRange(
    target.combatantProperties
  );
  const constrainToXZPlane = !shouldFlyTowardsTarget;

  if (constrainToXZPlane) {
    destination.y = homePosition.y;
  }

  if (constrainToXZPlane) {
    // Use XZ-projected look rotation
    const forwardXZ = targetTransformProperties.getHomePosition().subtract(homePosition);
    forwardXZ.y = 0;
    forwardXZ.normalize();
    destinationRotation = getLookRotationFromPositions(homePosition, homePosition.add(forwardXZ));
  } else {
    destinationRotation = getLookRotationFromPositions(
      homePosition,
      targetTransformProperties.getHomePosition()
    );
  }

  return {
    position: destination,
    rotation: destinationRotation,
  };
}
