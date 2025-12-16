import { Matrix, Quaternion, Vector3 } from "@babylonjs/core";
import {
  ActionResolutionStepContext,
  EntityDestination,
} from "../../../action-processing/index.js";
import { TargetingCalculator } from "../../targeting/targeting-calculator.js";
import { Combatant } from "../../../combatants/index.js";
import { IActionUser } from "../../../action-user-context/action-user.js";

export function getHomeDestination(context: ActionResolutionStepContext) {
  const { actionUserContext } = context;
  const { actionUser } = actionUserContext;

  const toReturn: EntityDestination = {
    position: actionUser.getHomePosition().clone(),
    rotation: actionUser.getHomeRotation().clone(),
  };

  return toReturn;
}

export function getStepForwardDestination(context: ActionResolutionStepContext) {
  const { actionUserContext } = context;
  const { actionUser } = actionUserContext;

  const isRestrained = actionUser.movementIsRestrained();
  if (isRestrained) {
    return null;
  }

  // @REFACTOR - just get the "direction of their home vector towards center line"

  const z = actionUser.getHomePosition().z;
  const direction = z > 0 ? -1 : 1;
  const directionVector = new Vector3(0, 0, direction);

  return { position: actionUser.getHomePosition().add(directionVector.scale(1)) };
}

export function getRotateTowardPrimaryTargetDestination(context: ActionResolutionStepContext) {
  const { actionUserContext, tracker } = context;
  const { actionExecutionIntent } = tracker;
  const targetingCalculator = new TargetingCalculator(actionUserContext, null);
  const primaryTargetResult = targetingCalculator.getPrimaryTargetCombatant(
    actionUserContext.party,
    actionExecutionIntent
  );

  if (primaryTargetResult instanceof Error) return primaryTargetResult;
  const { actionUser } = actionUserContext;

  const isRestrained = actionUser.movementIsRestrained();
  if (isRestrained) {
    return null;
  }

  const targetingSelf = primaryTargetResult.entityProperties.id === actionUser.getEntityId();
  if (targetingSelf) {
    return { rotation: actionUser.getHomeRotation() };
  }

  const target = primaryTargetResult;

  const destinationRotation = getDestinationRotation(actionUser, target);

  return {
    rotation: destinationRotation,
  };
}

export function getPrimaryTargetPositionAsDestination(
  context: ActionResolutionStepContext
): Error | EntityDestination {
  const { actionUserContext, tracker } = context;
  const { actionExecutionIntent } = tracker;

  const targetingCalculator = new TargetingCalculator(actionUserContext, null);
  const primaryTargetResult = targetingCalculator.getPrimaryTargetCombatant(
    actionUserContext.party,
    actionExecutionIntent
  );
  if (primaryTargetResult instanceof Error) return primaryTargetResult;

  const target = primaryTargetResult;

  const position = target.combatantProperties.transformProperties.position.clone();

  return { position };
}

function getDestinationRotation(actionUser: IActionUser, target: Combatant) {
  const shouldTiltTowardTarget = !actionUser.targetFlyingConditionPreventsReachingMeleeRange(
    target.combatantProperties
  );
  //
  // const shouldTiltTowardTarget = true;

  if (shouldTiltTowardTarget) {
    return getLookAtRotationWhileMaintainingRoll(actionUser, target);
  } else {
    return getLookAtRotationWhileMaintainingPitchAndRoll(actionUser, target);
  }
}

function getLookAtRotationWhileMaintainingPitchAndRoll(actionUser: IActionUser, target: Combatant) {
  // Constrain rotation to XZ plane (ignore vertical)
  const actionPosition = actionUser.getHomePosition();
  const targetPosition = target.combatantProperties.transformProperties.getHomePosition();

  // Project onto XZ plane
  const forwardXZ = new Vector3(
    targetPosition.x - actionPosition.x,
    0,
    targetPosition.z - actionPosition.z
  ).normalize();

  const worldUp = new Vector3(0, 1, 0);
  const right = Vector3.Cross(worldUp, forwardXZ).normalize();
  const correctedUp = Vector3.Cross(forwardXZ, right).normalize();

  const rotationMatrix = new Matrix();
  Matrix.FromXYZAxesToRef(right, correctedUp, forwardXZ, rotationMatrix);
  return Quaternion.FromRotationMatrix(rotationMatrix);
}

/** Look at target while maintaining roll - From Chat GPT*/
function getLookAtRotationWhileMaintainingRoll(actionUser: IActionUser, target: Combatant) {
  // Compute direction toward target
  const forward = target.combatantProperties.transformProperties
    .getHomePosition()
    .subtract(actionUser.getHomePosition())
    .normalize();

  // Use world up (y-axis) to avoid flipping
  const worldUp = new Vector3(0, 1, 0);
  // Build a stable basis: right = up × forward; correctedUp = forward × right
  const right = Vector3.Cross(worldUp, forward).normalize();
  const correctedUp = Vector3.Cross(forward, right).normalize();
  // Construct rotation matrix
  const rotationMatrix = new Matrix();
  Matrix.FromXYZAxesToRef(right, correctedUp, forward, rotationMatrix);
  // Convert to quaternion
  const destinationRotation = Quaternion.FromRotationMatrix(rotationMatrix);
  return destinationRotation;
}
