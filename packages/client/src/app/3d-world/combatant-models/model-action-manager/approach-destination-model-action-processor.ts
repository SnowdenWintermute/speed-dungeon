import { ERROR_MESSAGES } from "@speed-dungeon/common";
import { CombatantModelActionProgressTracker, CombatantModelActionType } from "./model-actions";
import { ModularCharacter } from "../modular-character";
import { Quaternion, Vector3 } from "babylonjs";

export default function approachDestinationModelActionProcessor(
  combatantModel: ModularCharacter,
  modelActionTracker: CombatantModelActionProgressTracker
) {
  const { modelAction } = modelActionTracker;
  if (modelAction.type !== CombatantModelActionType.ApproachDestination)
    return console.error(new Error(ERROR_MESSAGES.GAME_WORLD.INCORRECT_MODEL_ACTION));

  const {
    previousLocation,
    destinationLocation,
    timeToTranslate,
    previousRotation,
    destinationRotation,
    timeToRotate,
    percentTranslationToTriggerCompletionEvent,
    onComplete,
  } = modelAction;

  const timeSinceStarted = Date.now() - modelActionTracker.timeStarted;
  const percentTranslated = Math.max(0, Math.min(1, timeSinceStarted / timeToTranslate));

  const newPosition = Vector3.Lerp(previousLocation, destinationLocation, percentTranslated);

  combatantModel.rootTransformNode.position = newPosition;

  let percentRotated = 1;
  if (timeToRotate > 0) percentRotated = Math.min(1, timeSinceStarted / timeToRotate);

  combatantModel.rootTransformNode.rotationQuaternion = Quaternion.Slerp(
    previousRotation,
    destinationRotation,
    percentRotated
  );

  if (percentTranslated >= percentTranslationToTriggerCompletionEvent) onComplete();
  if (percentTranslated >= 1) combatantModel.modelActionManager.removeActiveModelAction();
}
