import { Quaternion, Vector3 } from "babylonjs";
import { GameWorld } from ".";
import cloneDeep from "lodash.clonedeep";
import { StartReturningHomeMessage } from "@/stores/next-babylon-messaging-store/next-to-babylon-messages";
import {
  AdventuringParty,
  COMBATANT_TIME_TO_MOVE_ONE_METER,
  COMBATANT_TIME_TO_ROTATE_360,
  CombatantProperties,
  ERROR_MESSAGES,
  InputLock,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import { ANIMATION_NAMES } from "../combatant-models/animation-manager/animation-names";
import {
  CombatantModelAction,
  CombatantModelActionType,
} from "../combatant-models/model-action-manager/model-actions";

export default function startReturningHome(
  gameWorld: GameWorld,
  message: StartReturningHomeMessage
) {
  // CLIENT
  // - set the combatant model's animation manager to translate it back to home position
  // - end the combatant's turn if in combat and action required turn
  // - process next action command if any (ai actions in queue, party wipes, party defeats, equipment swaps initiated during last action)

  const { actionUserId, actionCommandPayload } = message;
  const { shouldEndTurn } = actionCommandPayload;

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

  userCombatantModel.animationManager.startAnimationWithTransition(ANIMATION_NAMES.MOVE_BACK, 500);

  const modelAction: CombatantModelAction = {
    type: CombatantModelActionType.ApproachDestination,
    previousLocation,
    destinationLocation,
    timeToTranslate,
    previousRotation,
    destinationRotation,
    timeToRotate,
    onComplete: () => {
      userCombatantModel.animationManager.startAnimationWithTransition(ANIMATION_NAMES.IDLE, 500);

      gameWorld.mutateGameState((gameState) => {
        const partyResult = gameState.getParty();
        if (partyResult instanceof Error) return console.error(partyResult);
        const party = partyResult;

        const combatantResult = AdventuringParty.getCombatant(party, actionUserId);
        if (combatantResult instanceof Error) return console.error(combatantResult);
        InputLock.unlockInput(combatantResult.combatantProperties.inputLock);

        if (shouldEndTurn && party.battleId !== null) {
          const gameOption = gameState.game;
          if (gameOption === null) return console.error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
          SpeedDungeonGame.endActiveCombatantTurn(gameOption, party.battleId);
        }

        party.actionCommandManager.processNextCommand();
      });
    },
  };

  userCombatantModel.modelActionManager.modelActionQueue.push(modelAction);
}
