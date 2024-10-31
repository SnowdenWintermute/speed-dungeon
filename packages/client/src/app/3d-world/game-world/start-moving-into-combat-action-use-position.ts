import { Matrix, Quaternion, Vector3 } from "@babylonjs/core";
import { GameWorld } from ".";
import cloneDeep from "lodash.clonedeep";
import { StartMovingCombatantIntoCombatActionPositionMessage } from "@/stores/next-babylon-messaging-store/next-to-babylon-messages";
import {
  AdventuringParty,
  COMBATANT_TIME_TO_ROTATE_360,
  CombatantProperties,
  ERROR_MESSAGES,
  InputLock,
  cloneVector3,
} from "@speed-dungeon/common";
import getCurrentParty from "@/utils/getCurrentParty";
import { ANIMATION_NAMES } from "../combatant-models/animation-manager/animation-names";
import {
  CombatantModelAction,
  CombatantModelActionType,
} from "../combatant-models/model-action-manager/model-actions";
import { actionCommandManager } from "@/singletons/action-command-manager";

export default function startMovingIntoCombatActionUsePosition(
  gameWorld: GameWorld,
  message: StartMovingCombatantIntoCombatActionPositionMessage
) {
  const { actionUserId, actionCommandPayload } = message;
  const { primaryTargetId, isMelee } = actionCommandPayload;

  gameWorld.mutateGameState((gameState) => {
    const partyResult = getCurrentParty(gameState, gameState.username || "");
    if (partyResult === undefined) return console.error(ERROR_MESSAGES.CLIENT.NO_CURRENT_PARTY);
    const party = partyResult;
    const primaryTargetResult = AdventuringParty.getCombatant(party, primaryTargetId);
    if (primaryTargetResult instanceof Error) return console.error(primaryTargetResult);
    const primaryTarget = primaryTargetResult;

    const actionUserResult = AdventuringParty.getCombatant(party, actionUserId);
    if (actionUserResult instanceof Error) return console.error(actionUserResult);
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

    const userCombatantModelOption = gameWorld.modelManager.combatantModels[actionUserId];
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

      destinationQuaternion = Quaternion.FromRotationMatrix(lookingAtMatrix);

      const rotationDistance = Quaternion.Distance(userModelCurrentRotation, destinationQuaternion);
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
      onComplete: () => actionCommandManager.processNextCommand(),
    };

    userCombatantModel.modelActionManager.startNewModelAction(modelAction);
  });
}
