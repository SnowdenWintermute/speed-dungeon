import { Matrix, Quaternion, Vector3 } from "@babylonjs/core";
import cloneDeep from "lodash.clonedeep";
import {
  AdventuringParty,
  COMBATANT_TIME_TO_ROTATE_360,
  CombatantProperties,
  ERROR_MESSAGES,
  EntityId,
  InputLock,
  MoveIntoCombatActionPositionActionCommandPayload,
  cloneVector3,
} from "@speed-dungeon/common";
import getCurrentParty from "@/utils/getCurrentParty";
import { ANIMATION_NAMES } from "../../combatant-models/animation-manager/animation-names";
import {
  CombatantModelAction,
  CombatantModelActionType,
} from "../../combatant-models/model-action-manager/model-actions";
import { useGameStore } from "@/stores/game-store";
import { gameWorld } from "../../SceneManager";

export default async function startMovingIntoCombatActionUsePosition(
  actionUserId: EntityId,
  actionCommandPayload: MoveIntoCombatActionPositionActionCommandPayload
) {
  const maybeError = await new Promise<Error | void>((resolve, _reject) => {
    const { primaryTargetId, isMelee } = actionCommandPayload;

    useGameStore.getState().mutateState((gameState) => {
      if (!gameWorld.current) return resolve(new Error("no game world"));
      const partyResult = getCurrentParty(gameState, gameState.username || "");
      if (partyResult === undefined)
        return resolve(new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_PARTY));
      const party = partyResult;
      const primaryTargetResult = AdventuringParty.getCombatant(party, primaryTargetId);
      if (primaryTargetResult instanceof Error) return resolve(primaryTargetResult);
      const primaryTarget = primaryTargetResult;

      const actionUserResult = AdventuringParty.getCombatant(party, actionUserId);
      if (actionUserResult instanceof Error) return resolve(actionUserResult);
      const actionUser = actionUserResult;

      actionUser.combatantProperties.selectedCombatAction = null;
      actionUser.combatantProperties.combatActionTarget = null;

      InputLock.lockInput(party.inputLock);

      const { destinationLocation, totalTimeToReachDestination } =
        CombatantProperties.getPositionForActionUse(
          actionUser.combatantProperties,
          primaryTarget.combatantProperties,
          isMelee
        );

      const userHomeLocation = actionUser.combatantProperties.homeLocation;
      const targetHomeLocation = primaryTarget.combatantProperties.homeLocation;

      const userCombatantModelOption = gameWorld.current.modelManager.combatantModels[actionUserId];
      if (userCombatantModelOption === undefined)
        return console.error(ERROR_MESSAGES.GAME_WORLD.NO_COMBATANT_MODEL);
      const userCombatantModel = userCombatantModelOption;

      const userModelCurrentRotation = userCombatantModel.rootTransformNode.rotationQuaternion;
      if (userModelCurrentRotation === null)
        return console.error(ERROR_MESSAGES.GAME_WORLD.MISSING_ROTATION_QUATERNION);

      let destinationQuaternion = userCombatantModel.homeLocation.rotation;
      let timeToRotate = 0;

      if (isMelee) {
        const lookingAtMatrix = Matrix.LookAtLH(
          destinationLocation,
          cloneVector3(targetHomeLocation),
          Vector3.Up()
        ).invert();

        // // Step 1: Calculate the direction vector from Mesh A to Mesh B
        // const direction = userCombatantModel.rootTransformNode.position
        //   .subtract(targetHomeLocation)
        //   .normalize();
        // // Step 2: Create the target rotation (look at Mesh B)
        // const destinationQuaternion = Quaternion.FromEulerAngles(
        //   0,
        //   Math.atan2(direction.x, direction.z),
        //   0
        // );

        // destinationQuaternion = Quaternion.FromRotationMatrix(lookingAtMatrix);

        const rotationDistance = Quaternion.Distance(
          userModelCurrentRotation,
          destinationQuaternion
        );
        timeToRotate = (COMBATANT_TIME_TO_ROTATE_360 / (2 * Math.PI)) * rotationDistance;
      }
      // start their running forward animation
      userCombatantModel.animationManager.startAnimationWithTransition(
        ANIMATION_NAMES.MOVE_FORWARD,
        500
      );

      const modelAction: CombatantModelAction = {
        type: CombatantModelActionType.ApproachDestination,
        previousLocation: cloneDeep(userHomeLocation),
        destinationLocation: cloneDeep(destinationLocation),
        timeToTranslate: totalTimeToReachDestination,
        previousRotation: cloneDeep(userModelCurrentRotation),
        destinationRotation: cloneDeep(destinationQuaternion),
        percentTranslationToTriggerCompletionEvent: 1,
        timeToRotate,
        onComplete: () => {
          resolve();
        },
      };

      userCombatantModel.modelActionManager.startNewModelAction(modelAction);
    });
  });
  if (maybeError instanceof Error) return maybeError;
}
