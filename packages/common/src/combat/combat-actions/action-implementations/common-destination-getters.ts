import { Quaternion, Vector3 } from "@babylonjs/core";
import {
  ActionResolutionStepContext,
  EntityDestination,
} from "../../../action-processing/index.js";
import { CombatantProperties } from "../../../combatants/index.js";
import { TargetingCalculator } from "../../targeting/targeting-calculator.js";

export function getHomeDestination(context: ActionResolutionStepContext) {
  const { combatantContext } = context;
  const { combatantProperties } = combatantContext.combatant;

  const toReturn: EntityDestination = {
    position: combatantProperties.homeLocation.clone(),
    rotation: combatantProperties.homeRotation.clone(),
  };

  return toReturn;
}

export function getStepForwardDestination(context: ActionResolutionStepContext) {
  const { combatantContext } = context;
  const user = combatantContext.combatant.combatantProperties;
  const direction = CombatantProperties.getForward(user);
  return { position: user.homeLocation.add(direction.scale(0.5)) };
}

export function getRotateTowardPrimaryTargetDestination(context: ActionResolutionStepContext) {
  const { combatantContext, tracker } = context;
  const { actionExecutionIntent } = tracker;
  const targetingCalculator = new TargetingCalculator(combatantContext, null);
  const primaryTargetResult = targetingCalculator.getPrimaryTargetCombatant(
    combatantContext.party,
    actionExecutionIntent
  );

  if (primaryTargetResult instanceof Error) return primaryTargetResult;
  const target = primaryTargetResult;

  const direction = target.combatantProperties.homeLocation
    .subtract(combatantContext.combatant.combatantProperties.homeLocation)
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
  const { combatantContext, tracker } = context;
  const { actionExecutionIntent } = tracker;

  const targetingCalculator = new TargetingCalculator(combatantContext, null);
  const primaryTargetResult = targetingCalculator.getPrimaryTargetCombatant(
    combatantContext.party,
    actionExecutionIntent
  );
  if (primaryTargetResult instanceof Error) return primaryTargetResult;
  const target = primaryTargetResult;

  return { position: target.combatantProperties.homeLocation.clone() };
}
