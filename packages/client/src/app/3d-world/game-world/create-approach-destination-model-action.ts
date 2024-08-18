import { ActionResult, CombatActionTargetType, ERROR_MESSAGES } from "@speed-dungeon/common";
import { combatActionRequiresMeleeRange } from "@speed-dungeon/common";
import { ModularCharacter } from "../combatant-models/modular-character";
import { GameWorld } from ".";
import { CombatantModelAction, CombatantModelActionType } from "../combatant-models/model-actions";
import { Matrix, Quaternion, Vector3 } from "babylonjs";

export default function createApproachDestinationModelAction(
  gameWorld: GameWorld,
  actionUserModel: ModularCharacter,
  actionResult: ActionResult
): Error | CombatantModelAction {
  let destinationLocation: null | Vector3 = actionUserModel.homeLocation.position;
  let destinationQuaternion: null | Quaternion = actionUserModel.homeLocation.rotation;

  // approach destination based on melee or not
  const isMelee = combatActionRequiresMeleeRange(actionResult.action);
  if (isMelee) {
    // get position of target
    let targetIdOption = null;
    if (actionResult.target.type === CombatActionTargetType.Single) {
      targetIdOption = actionResult.target.targetId;
    }

    let targetModelOption: null | undefined | ModularCharacter = null;
    if (targetIdOption !== null)
      targetModelOption = gameWorld.modelManager.combatantModels[targetIdOption];
    if (targetModelOption === undefined)
      return new Error(ERROR_MESSAGES.GAME_WORLD.NO_COMBATANT_MODEL);
    if (targetModelOption !== null) {
      const targetModel = targetModelOption;

      // assign destination based on target location and their hitbox radius
      const direction = targetModel.rootMesh.position
        .subtract(actionUserModel.rootMesh.position)
        .normalize();
      destinationLocation = targetModel.rootMesh.position.subtract(
        direction.scale(targetModel.hitboxRadius)
      );

      // set rotation: https://forum.babylonjs.com/t/how-to-make-smooth-mesh-lookat/31243/3
      const lookingAtMatrix = Matrix.LookAtLH(
        actionUserModel.rootMesh.position,
        targetModel.rootMesh.position,
        Vector3.Up()
      ).invert();
      destinationQuaternion = Quaternion.FromRotationMatrix(lookingAtMatrix);
    }
  } else {
    // assign destination to move a little forward (default ranged attack/spell casting position)
    const direction = actionUserModel.rootMesh.forward;
    destinationLocation = actionUserModel.rootMesh.position.add(direction.scale(1.5));
  }

  if (!actionUserModel.rootMesh.rotationQuaternion)
    return new Error(ERROR_MESSAGES.GAME_WORLD.MISSING_ROTATION_QUATERNION);

  return {
    type: CombatantModelActionType.ApproachDestination,
    previousLocation: actionUserModel.rootMesh.position,
    previousRotation: actionUserModel.rootMesh.rotationQuaternion,
    distance: Vector3.Distance(actionUserModel.rootMesh.position, destinationLocation),
    destinationLocation,
    destinationRotation: destinationQuaternion,
  };
}
