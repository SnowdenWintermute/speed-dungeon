import {
  COMBATANT_TIME_TO_MOVE_ONE_METER,
  COMBATANT_TIME_TO_ROTATE_360,
  ERROR_MESSAGES,
} from "@speed-dungeon/common";
import { CombatantModelActionProgressTracker, CombatantModelActionType } from "../model-actions";
import { ModularCharacter } from "../modular-character";
import { Quaternion, Vector3 } from "babylonjs";

export default function approachDestinationModelActionProcessor(
  combatantModel: ModularCharacter,
  modelActionTracker: CombatantModelActionProgressTracker
) {
  const { modelAction } = modelActionTracker;
  if (
    modelAction.type !== CombatantModelActionType.ApproachDestination &&
    modelAction.type !== CombatantModelActionType.ReturnHome
  )
    return console.error(new Error(ERROR_MESSAGES.GAME_WORLD.INCORRECT_MODEL_ACTION));

  const speedMultiplier = modelAction.type === CombatantModelActionType.ReturnHome ? 0.75 : 1;

  const timeSinceStarted = Date.now() - modelActionTracker.timeStarted;
  const totalTimeToReachDestination =
    COMBATANT_TIME_TO_MOVE_ONE_METER * speedMultiplier * modelAction.distance;
  const percentTravelled = Math.min(1, timeSinceStarted / totalTimeToReachDestination);

  const newPosition = Vector3.Lerp(
    modelAction.previousLocation,
    modelAction.destinationLocation,
    percentTravelled
  );

  combatantModel.rootTransformNode.position = newPosition;

  const totalTimeToRotate =
    (COMBATANT_TIME_TO_ROTATE_360 / (2 * Math.PI)) * modelAction.rotationDistance;

  const percentRotated = Math.min(1, timeSinceStarted / totalTimeToRotate);

  combatantModel.rootTransformNode.rotationQuaternion = Quaternion.Slerp(
    modelAction.previousRotation,
    modelAction.destinationRotation,
    percentRotated
  );

  if (
    modelAction.type === CombatantModelActionType.ApproachDestination &&
    percentTravelled > 0.8 &&
    !modelAction.transitionToNextActionStarted
  ) {
    // start next
    const nextActionOption = combatantModel.modelActionQueue.shift();
    if (nextActionOption)
      combatantModel.startModelAction(combatantModel.world.mutateGameState, nextActionOption);
    modelAction.transitionToNextActionStarted = true;
  }

  if (percentTravelled >= 1 && percentRotated >= 1) {
    combatantModel.removeActiveModelAction(modelAction.type);
  }
}
