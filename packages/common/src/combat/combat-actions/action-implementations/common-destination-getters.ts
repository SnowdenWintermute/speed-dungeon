import { Quaternion, Vector3 } from "@babylonjs/core";
import {
  ActionResolutionStepContext,
  EntityDestination,
} from "../../../action-processing/index.js";
import { TargetingCalculator } from "../../targeting/targeting-calculator.js";

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
  const target = primaryTargetResult;

  const { actionUser } = actionUserContext;

  if (primaryTargetResult.entityProperties.id === actionUser.getEntityId())
    return { rotation: actionUser.getHomeRotation() };

  const direction = target.combatantProperties.homeLocation
    .subtract(actionUser.getHomePosition())
    .normalize();

  const destinationRotation = Quaternion.FromUnitVectorsToRef(
    new Vector3(0, 0, 1),
    direction,
    new Quaternion()
  );

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

  return { position: target.combatantProperties.homeLocation.clone() };
}
