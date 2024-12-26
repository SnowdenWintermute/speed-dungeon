import { Quaternion, Vector3 } from "@babylonjs/core";
import cloneDeep from "lodash.clonedeep";
import {
  ActionCommandType,
  COMBATANT_TIME_TO_MOVE_ONE_METER,
  COMBATANT_TIME_TO_ROTATE_360,
  ERROR_MESSAGES,
  InputLock,
  ReturnHomeActionCommandPayload,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import { ANIMATION_NAMES } from "../../combatant-models/animation-manager/animation-names";
import {
  CombatantModelAction,
  CombatantModelActionType,
} from "../../combatant-models/model-action-manager/model-actions";
import getCurrentParty from "@/utils/getCurrentParty";
import { useGameStore } from "@/stores/game-store";
import { gameWorld } from "../../SceneManager";
import { actionCommandQueue } from "@/singletons/action-command-manager";

export default async function startReturningHome(
  actionUserId: string,
  actionCommandPayload: ReturnHomeActionCommandPayload
) {
  await new Promise<Error | void>((resolve, reject) => {
    // CLIENT
    // - set the combatant model's animation manager to translate it back to home position
    // - end the combatant's turn if in combat and action required turn
    // - process next action command if any (ai actions in queue, party wipes, party defeats, equipment swaps initiated during last action)

    if (!gameWorld.current) return resolve(new Error("no game world"));

    const { shouldEndTurn } = actionCommandPayload;

    const userCombatantModelOption = gameWorld.current.modelManager.combatantModels[actionUserId];
    if (userCombatantModelOption === undefined)
      return resolve(new Error(ERROR_MESSAGES.GAME_WORLD.NO_COMBATANT_MODEL));
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

    // unlock input / end turn as they are running back
    // so players can start their next input already
    useGameStore.getState().mutateState((gameState) => {
      if (!gameState.username) return resolve(new Error(ERROR_MESSAGES.CLIENT.NO_USERNAME));
      const partyResult = getCurrentParty(gameState, gameState.username);
      if (partyResult instanceof Error) return resolve(partyResult);
      const partyOption = partyResult;
      if (partyOption === undefined)
        return resolve(new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_PARTY));
      const party = partyOption;
      if (!gameState.game) return resolve(new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME));

      // check the queue length so we don't unlock for a split second in between the ai's turns
      if (
        actionCommandQueue.commands.length === 0 ||
        actionCommandQueue.commands[0]?.payload.type === ActionCommandType.GameMessages
      )
        InputLock.unlockInput(party.inputLock);

      if (shouldEndTurn && party.battleId !== null) {
        const gameOption = gameState.game;
        if (gameOption === null) return resolve(new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME));
        const battleOption = SpeedDungeonGame.getBattleOption(gameState.game, party.battleId);
        if (!battleOption) return resolve(new Error(ERROR_MESSAGES.GAME.BATTLE_DOES_NOT_EXIST));
        const maybeError = SpeedDungeonGame.endActiveCombatantTurn(gameOption, battleOption);
        if (maybeError instanceof Error) console.error(maybeError);
      }
    });

    const modelAction: CombatantModelAction = {
      type: CombatantModelActionType.ApproachDestination,
      previousLocation,
      destinationLocation,
      timeToTranslate,
      previousRotation,
      destinationRotation,
      timeToRotate,
      percentTranslationToTriggerCompletionEvent: 1,
      onComplete: () => {
        userCombatantModel.animationManager.startAnimationWithTransition(ANIMATION_NAMES.IDLE, 500);
        // try to mark this event as completed if no one is in hit recovery
        resolve();
      },
    };

    userCombatantModel.modelActionManager.startNewModelAction(modelAction);
  });
}
