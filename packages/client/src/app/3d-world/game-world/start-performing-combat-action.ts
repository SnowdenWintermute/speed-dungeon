import {
  COMBATANT_TIME_TO_MOVE_ONE_METER,
  ERROR_MESSAGES,
  SpeedDungeonGame,
  combatActionRequiresMeleeRange,
} from "@speed-dungeon/common";
import { GameWorld } from ".";
import { StartPerformingCombatActionMessage } from "@/stores/next-babylon-messaging-store/next-to-babylon-messages";
import cloneDeep from "lodash.clonedeep";
import { Vector3 } from "@babylonjs/core";
import getCombatActionAnimationName from "../combatant-models/animation-manager/animation-names";
import {
  CombatantModelAction,
  CombatantModelActionType,
} from "../combatant-models/model-action-manager/model-actions";
import getFrameEventFromAnimation from "../combatant-models/animation-manager/get-frame-event-from-animation";
import { getCombatActionExecutionTime } from "@speed-dungeon/common";
import { actionCommandManager } from "@/singletons/action-command-manager";

export default function startPerformingCombatAction(
  gameWorld: GameWorld,
  message: StartPerformingCombatActionMessage
) {
  // CLIENT
  // - if melee, animate client forward a "weapon approach distance" based on equipped weapon and action type
  // - start transitioning to their attack animation with frame event to apply hp/mp/effect changes to target
  // - play the animation so it takes up the entire "action performance time"
  // - frame event applies hpChange, mpChange, and status effect changes
  // - frame event starts hit recovery/evade/death animation on targets
  // - NOT USED: animation manager for target has separate slot for hit recovery animation as a "prioritized animation" but continues
  //   progressing "main animation" in the background so it can be switched back to after hit recovery completion
  // - handle any death by removing the affected combatant's turn tracker
  // - handle any ressurection by adding the affected combatant's turn tracker
  // - on animation complete, start next action
  const { combatAction } = message.actionCommandPayload;
  const { actionUserId } = message;

  const userCombatantModelOption = gameWorld.modelManager.combatantModels[actionUserId];
  if (userCombatantModelOption === undefined)
    return console.error(ERROR_MESSAGES.GAME_WORLD.NO_COMBATANT_MODEL);
  const userCombatantModel = userCombatantModelOption;

  // START THEIR ANIMATION AND CALL ONCOMPLETE WHEN DONE
  const animationName = getCombatActionAnimationName(combatAction);
  const animationEventOption = getFrameEventFromAnimation(
    gameWorld,
    message.actionCommandPayload,
    actionUserId
  );

  // get the execution time
  let combatActionExecutionTimeResult: Error | number = new Error(
    "couldn't get action execution time"
  );

  gameWorld.mutateGameState((gameState) => {
    if (!gameState.game)
      return (combatActionExecutionTimeResult = new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME));
    const combatantResult = SpeedDungeonGame.getCombatantById(gameState.game, actionUserId);
    if (combatantResult instanceof Error)
      return (combatActionExecutionTimeResult = combatantResult);
    combatActionExecutionTimeResult = getCombatActionExecutionTime(
      combatantResult.combatantProperties,
      combatAction
    );
  });
  if (combatActionExecutionTimeResult instanceof Error)
    return console.error(combatActionExecutionTimeResult);

  userCombatantModel.animationManager.startAnimationWithTransition(animationName, 500, {
    shouldLoop: false,
    animationEventOption,
    animationDurationOverrideOption: combatActionExecutionTimeResult,
    onComplete: () => actionCommandManager.processNextCommand(),
  });

  const isMelee = combatActionRequiresMeleeRange(combatAction);

  if (!isMelee || (isMelee && userCombatantModel.isInMeleeRangeOfTarget)) return;
  // QUEUE/START THE MODEL ACTION (FOR MOVEMENT) IF MELEE
  // AND DIDN'T ALREADY MOVE FORWARD

  const direction = userCombatantModel.rootTransformNode.forward;
  const previousLocation = cloneDeep(userCombatantModel.rootTransformNode.position);
  const destinationLocation = userCombatantModel.rootTransformNode.position.add(
    direction.scale(1.5)
  );
  const distance = Vector3.Distance(previousLocation, destinationLocation);
  const speedMultiplier = 1;
  const timeToTranslate = COMBATANT_TIME_TO_MOVE_ONE_METER * speedMultiplier * distance;
  const userModelCurrentRotation = userCombatantModel.rootTransformNode.rotationQuaternion;
  if (!userModelCurrentRotation)
    return console.error(ERROR_MESSAGES.GAME_WORLD.MISSING_ROTATION_QUATERNION);

  userCombatantModel.isInMeleeRangeOfTarget = true;

  const modelAction: CombatantModelAction = {
    type: CombatantModelActionType.ApproachDestination,
    previousLocation,
    destinationLocation,
    timeToTranslate,
    previousRotation: userModelCurrentRotation,
    destinationRotation: userModelCurrentRotation,
    timeToRotate: 0,
    percentTranslationToTriggerCompletionEvent: 1,
    onComplete: () => {},
  };

  userCombatantModel.modelActionManager.startNewModelAction(modelAction);
}
