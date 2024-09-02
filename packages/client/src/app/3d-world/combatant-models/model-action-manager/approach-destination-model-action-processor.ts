import { ERROR_MESSAGES, formatVector3 } from "@speed-dungeon/common";
import { CombatantModelActionProgressTracker, CombatantModelActionType } from "./model-actions";
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

  const {
    previousLocation,
    destinationLocation,
    timeToTranslate,
    previousRotation,
    destinationRotation,
    timeToRotate,
    onComplete,
  } = modelAction;

  const timeSinceStarted = Date.now() - modelActionTracker.timeStarted;
  const percentTranslated = Math.min(1, timeSinceStarted / timeToTranslate);

  const newPosition = Vector3.Lerp(previousLocation, destinationLocation, percentTranslated);

  // console.log(formatVector3(newPosition));

  combatantModel.rootTransformNode.position = newPosition;

  const percentRotated = Math.min(1, timeSinceStarted / timeToRotate);

  combatantModel.rootTransformNode.rotationQuaternion = Quaternion.Slerp(
    previousRotation,
    destinationRotation,
    percentRotated
  );

  if (percentTranslated >= 1) {
    onComplete();
    combatantModel.modelActionManager.removeActiveModelAction();
  }
}
