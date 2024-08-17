import { COMBATANT_TIME_TO_MOVE_ONE_METER, ERROR_MESSAGES } from "@speed-dungeon/common";
import { CombatantModelActionProgressTracker, CombatantModelActionType } from "../model-actions";
import { ModularCharacter } from "../modular-character";
import { Vector3 } from "babylonjs";

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

  combatantModel.rootMesh.position = newPosition;

  if (percentTravelled > 1) {
    delete combatantModel.activeModelActions[CombatantModelActionType.ApproachDestination];
  }
}
