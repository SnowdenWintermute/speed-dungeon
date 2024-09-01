import {
  COMBATANT_TIME_TO_MOVE_ONE_METER,
  ERROR_MESSAGES,
  combatActionRequiresMeleeRange,
} from "@speed-dungeon/common";
import { GameWorld } from ".";
import { StartPerformingCombatActionMessage } from "@/stores/next-babylon-messaging-store/next-to-babylon-messages";
import cloneDeep from "lodash.clonedeep";
import { Vector3 } from "babylonjs";
import getModelActionAnimationName from "../combatant-models/get-model-action-animation-name";
import getCombatActionAnimationName from "../combatant-models/get-combat-action-animation-name";

export default function startPerformCombatActionModelAction(
  gameWorld: GameWorld,
  message: StartPerformingCombatActionMessage
) {
  // CLIENT
  // - if melee, animate client forward a "weapon approach distance" based on equipped weapon and action type
  // - start transitioning to their attack animation with frame event to apply hp/mp/effect changes to target
  // - play the animation so it takes up the entire "action performance time"
  // - frame event applies hpChange, mpChange, and status effect changes
  // - frame event starts hit recovery/evade/death animation on targets
  // - animation manager for target has separate slot for hit recovery animation as a "prioritized animation" but continues
  //   progressing "main animation" in the background so it can be switched back to after hit recovery completion
  // - handle any death by removing the affected combatant's turn tracker
  // - handle any ressurection by adding the affected combatant's turn tracker
  // - on animation complete, start next action
  const { combatAction, hpChangesByEntityId, mpChangesByEntityId, missesByEntityId } =
    message.actionCommandPayload;
  const { actionUserId } = message;
  const isMelee = combatActionRequiresMeleeRange(combatAction);

  const userCombatantModelOption = gameWorld.modelManager.combatantModels[actionUserId];
  if (userCombatantModelOption === undefined)
    return console.error(ERROR_MESSAGES.GAME_WORLD.NO_COMBATANT_MODEL);
  const userCombatantModel = userCombatantModelOption;

  const direction = userCombatantModel.rootTransformNode.forward;
  const previousLocation = cloneDeep(userCombatantModel.rootTransformNode.position);
  const destinationLocation = userCombatantModel.rootTransformNode.position.add(
    direction.scale(1.5)
  );
  const distance = Vector3.Distance(previousLocation, destinationLocation);
  const speedMultiplier = 1;
  const timeToTranslate = COMBATANT_TIME_TO_MOVE_ONE_METER * speedMultiplier * distance;

  const animationNameResult = getCombatActionAnimationName(combatAction);
  // const modelAction: CombatantModelAction = {
  //   type: CombatantModelActionType.ApproachDestination,
  //   previousLocation: cloneDeep(userHomeLocation),
  //   destinationLocation: cloneDeep(destinationLocation),
  //   timeToTranslate: totalTimeToReachDestination,
  //   previousRotation: cloneDeep(userModelCurrentRotation),
  //   destinationRotation: cloneDeep(destinationQuaternion),
  //   timeToRotate,
  //   animationName,
  //   onComplete,
  // };

  // userCombatantModel.modelActionQueue.push(modelAction);
}
