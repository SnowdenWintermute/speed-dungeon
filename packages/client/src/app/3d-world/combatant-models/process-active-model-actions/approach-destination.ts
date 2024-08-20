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
  if (modelAction.type !== CombatantModelActionType.ApproachDestination)
    return new Error(ERROR_MESSAGES.GAME_WORLD.INCORRECT_MODEL_ACTION);

  const timeSinceStarted = Date.now() - modelActionTracker.timeStarted;
  const totalTimeToReachDestination = COMBATANT_TIME_TO_MOVE_ONE_METER * modelAction.distance;
  const percentTravelled = timeSinceStarted / totalTimeToReachDestination;

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

  if (percentTravelled > 1) {
    delete combatantModel.activeModelActions[CombatantModelActionType.ApproachDestination];
  }
}
