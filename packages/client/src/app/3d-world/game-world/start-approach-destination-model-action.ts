import { Matrix, Quaternion, Vector3 } from "babylonjs";
import { GameWorld } from ".";
import { CombatantModelActionType } from "../combatant-models/model-actions";
import cloneDeep from "lodash.clonedeep";

export default function startApproachDestinationModelAction(gameWorld: GameWorld) {
  console.log("handling move into position message: ", message);

  // NEED:
  // - destination location
  // - time to travel
  // - user model id (to get model current rotation)
  // - target home position (to get target rotation from destination which is on their outer swing radius to their model center)
  // - animationtype (move-forward or move-back)
  // - onComplete

  const lookingAtMatrix = Matrix.LookAtLH(
    message.destinationLocation,
    message.targetPosition,
    Vector3.Up()
  ).invert();
  const destinationQuaternion = Quaternion.FromRotationMatrix(lookingAtMatrix);

  // create a model action that when processed will translate/rotate model
  const modelAction = {
    type: CombatantModelActionType.ApproachDestination,
    previousLocation: cloneDeep(actionUserModel.rootTransformNode.position),
    previousRotation: cloneDeep(actionUserModel.rootTransformNode.rotationQuaternion),
    distance: Vector3.Distance(actionUserModel.rootTransformNode.position, destinationLocation),
    destinationLocation,
    destinationRotation: destinationQuaternion,
    rotationDistance: Quaternion.Distance(
      actionUserModel.rootTransformNode.rotationQuaternion,
      destinationQuaternion
    ),
    transitionToNextActionStarted: false,
  }; // toward destination and on completion call message.onComplete()
}
