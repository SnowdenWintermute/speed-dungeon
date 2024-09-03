import { Matrix, Quaternion, Vector3 } from "babylonjs";
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

export default function startMovingIntoCombatActionUsePosition(
  gameWorld: GameWorld,
  message: StartMovingCombatantIntoCombatActionPositionMessage
) {
  console.log("handling move into position message: ", message);
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

    InputLock.lockInput(actionUser.combatantProperties.inputLock);

    // - destination location
    // - time to travel
    const { destinationLocation, totalTimeToReachDestination } =
      CombatantProperties.getPositionForActionUse(
        actionUser.combatantProperties,
        primaryTarget.combatantProperties,
        isMelee
      );
    // NEED:
    //
    // - user model id (to get model current rotation)
    // - target home position (to get target rotation from destination which is on their outer swing radius to their model center)
    const userHomeLocation = actionUser.combatantProperties.homeLocation;
    const targetHomeLocation = primaryTarget.combatantProperties.homeLocation;

    const userCombatantModelOption = gameWorld.modelManager.combatantModels[actionUserId];
    if (userCombatantModelOption === undefined)
      return console.error(ERROR_MESSAGES.GAME_WORLD.NO_COMBATANT_MODEL);
    const userCombatantModel = userCombatantModelOption;

    // @todo - move this into returnhome
    userCombatantModel.isInMeleeRangeOfTarget = false;

    // - user home rotation
    // - target rotation
    // - time to rotate
    const lookingAtMatrix = Matrix.LookAtLH(
      destinationLocation,
      cloneVector3(targetHomeLocation),
      Vector3.Up()
    ).invert();
    const destinationQuaternion = Quaternion.FromRotationMatrix(lookingAtMatrix);

    const userModelCurrentRotation = userCombatantModel.rootTransformNode.rotationQuaternion;
    if (userModelCurrentRotation === null)
      return console.error(ERROR_MESSAGES.GAME_WORLD.MISSING_ROTATION_QUATERNION);
    const rotationDistance = Quaternion.Distance(userModelCurrentRotation, destinationQuaternion);
    const timeToRotate = (COMBATANT_TIME_TO_ROTATE_360 / (2 * Math.PI)) * rotationDistance;
    // create a model action that when processed will translate/rotate model
    // toward destination and on completion call message.onComplete()
    // - onComplete

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
      timeToRotate,
      onComplete: () => {
        gameWorld.mutateGameState((gameState) => {
          const partyResult = gameState.getParty();
          if (partyResult instanceof Error) return console.error(partyResult);
          partyResult.actionCommandManager.processNextCommand();
        });
      },
    };

    userCombatantModel.modelActionManager.modelActionQueue.push(modelAction);
  });
}
