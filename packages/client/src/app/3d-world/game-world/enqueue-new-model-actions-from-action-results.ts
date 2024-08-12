import combatActionRequiresMeleeRange from "@speed-dungeon/common/src/combat/combat-actions/combat-action-requires-melee-range";
import { ModularCharacter } from "../combatant-models/modular-character";
import { GameWorld } from ".";
import { Matrix } from "babylonjs";
import { CombatActionTargetType } from "@speed-dungeon/common/src/combat/targeting/combat-action-targets";
import { ERROR_MESSAGES } from "@speed-dungeon/common";

export default function enqueueNewModelActionsFromActionResults(
  this: ModularCharacter,
  gameWorld: GameWorld
) {
  let i = 0;
  while (this.actionResultsQueue.length > 0) {
    const actionResult = this.actionResultsQueue.shift()!;
    if (i === 0) {
      // const destination = current position + move forward a bit (default for non-melee)
      // approach destination based on melee or not
      const isMelee = combatActionRequiresMeleeRange(actionResult.action);
      if (isMelee) {
        // get position of target
        let targetIdOption = null;
        if (actionResult.target.type === CombatActionTargetType.Single) {
          targetIdOption = actionResult.target.targetId;
        }

        let targetModelOption: null | undefined | ModularCharacter = null;
        if (targetIdOption !== null) targetModelOption = gameWorld.combatantModels[targetIdOption];
        if (targetModelOption === undefined)
          return new Error(ERROR_MESSAGES.GAME_WORLD.NO_COMBATANT_MODEL);
        // reasign destination based on target location and their hitbox radius
      }
      this.modelActionQueue.push();
    }
    i += 1;
  }
  // this.skeleton.transformNodes[0].loo
}

// Matrix.LookAtLH(
// 	followerObj.position,
// 	targetObj.position,
// 	BABYLON.Vector3.Up()
// ).invert()
//
// followerObj.rotationQuaternion = BABYLON.Quaternion.FromRotationMatrix( lookAt );
// BABYLON.Quaternion.Slerp( rotationFrom, rotationTo, dt )
