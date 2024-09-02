import { Matrix, Quaternion, Vector3 } from "babylonjs";
import { GameWorld } from ".";
import cloneDeep from "lodash.clonedeep";
import { StartReturningHomeMessage } from "@/stores/next-babylon-messaging-store/next-to-babylon-messages";
import {
  AdventuringParty,
  COMBATANT_TIME_TO_MOVE_ONE_METER,
  COMBATANT_TIME_TO_ROTATE_360,
  CombatantProperties,
  ERROR_MESSAGES,
  cloneVector3,
} from "@speed-dungeon/common";
import getCurrentParty from "@/utils/getCurrentParty";
import { ANIMATION_NAMES } from "../combatant-models/animation-manager/animation-names";
import {
  CombatantModelAction,
  CombatantModelActionType,
} from "../combatant-models/model-action-manager/model-actions";

export default function startReturningHome(
  gameWorld: GameWorld,
  message: StartReturningHomeMessage
) {
  console.log("handling move into position message: ", message);
  const { actionUserId, actionCommandPayload, onComplete } = message;
  const { shouldEndTurn } = actionCommandPayload;

  gameWorld.mutateGameState((gameState) => {
    const userCombatantModelOption = gameWorld.modelManager.combatantModels[actionUserId];
    if (userCombatantModelOption === undefined)
      return console.error(ERROR_MESSAGES.GAME_WORLD.NO_COMBATANT_MODEL);
    const userCombatantModel = userCombatantModelOption;

    const previousLocation = cloneDeep(userCombatantModel.rootTransformNode.position);
    const destinationLocation = userCombatantModel.homeLocation.position;
    const distance = Vector3.Distance(previousLocation, destinationLocation);
    const speedMultiplier = 0.75;
    const timeToTranslate = COMBATANT_TIME_TO_MOVE_ONE_METER * speedMultiplier * distance;

    userCombatantModel.isInMeleeRangeOfTarget = false;

    const previousRotation = cloneDeep(userCombatantModel.rootTransformNode.rotationQuaternion);
    const destinationRotation = userCombatantModel.homeLocation.rotation;

    if (previousRotation === null)
      return console.error(ERROR_MESSAGES.GAME_WORLD.MISSING_ROTATION_QUATERNION);
    const rotationDistance = Quaternion.Distance(previousRotation, destinationRotation);
    const timeToRotate = (COMBATANT_TIME_TO_ROTATE_360 / (2 * Math.PI)) * rotationDistance;

    userCombatantModel.animationManager.startAnimationWithTransition(
      ANIMATION_NAMES.MOVE_BACK,
      500
    );

    const modelAction: CombatantModelAction = {
      type: CombatantModelActionType.ApproachDestination,
      previousLocation,
      destinationLocation,
      timeToTranslate,
      previousRotation,
      destinationRotation,
      timeToRotate,
      onComplete,
    };

    userCombatantModel.modelActionManager.modelActionQueue.push(modelAction);
  });
}
