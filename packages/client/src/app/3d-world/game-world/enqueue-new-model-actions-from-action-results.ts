import { ModularCharacter } from "../combatant-models/modular-character";
import { GameWorld } from ".";
import createApproachDestinationModelAction from "./create-approach-destination-model-action";
import { CombatantModelAction, CombatantModelActionType } from "../combatant-models/model-actions";
import { ERROR_MESSAGES } from "@speed-dungeon/common";
import { Quaternion, Vector3 } from "babylonjs";
import cloneDeep from "lodash.clonedeep";
import getCombatantInGameById from "@speed-dungeon/common/src/game/get-combatant-in-game-by-id";

export default function enqueueNewModelActionsFromActionResults(
  this: ModularCharacter,
  gameWorld: GameWorld
) {
  if (this.actionResultsQueue.length === 0) return;
  let shouldEndTurn = false;

  // gameWorld.mutateGameState((gameState) => {
  //   const gameOption = gameState.game;
  //   if (gameOption === null) return console.error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
  //   const combatantResult = getCombatantInGameById(gameOption, this.entityId);
  //   if (combatantResult instanceof Error) return console.error(combatantResult);
  //   console.log("setting ", combatantResult.entityProperties.id, " action target to null");
  //   combatantResult.combatantProperties.combatActionTarget = null;
  //   combatantResult.combatantProperties.selectedCombatAction = null;
  // });

  let returnHomeModelAction: CombatantModelAction;
  const approachDestinationModelActionResult = createApproachDestinationModelAction(
    gameWorld,
    this,
    this.actionResultsQueue[0]!
  );
  if (approachDestinationModelActionResult instanceof Error)
    return approachDestinationModelActionResult;
  this.modelActionQueue.push(approachDestinationModelActionResult);

  if (approachDestinationModelActionResult.type !== CombatantModelActionType.ApproachDestination)
    return new Error(ERROR_MESSAGES.CHECKED_EXPECTATION_FAILED);

  returnHomeModelAction = {
    type: CombatantModelActionType.ReturnHome,
    previousLocation: cloneDeep(approachDestinationModelActionResult.destinationLocation),
    previousRotation: cloneDeep(approachDestinationModelActionResult.destinationRotation),
    destinationLocation: cloneDeep(this.homeLocation.position),
    destinationRotation: cloneDeep(this.homeLocation.rotation),
    distance: Vector3.Distance(
      approachDestinationModelActionResult.destinationLocation,
      this.homeLocation.position
    ),
    rotationDistance: Quaternion.Distance(
      approachDestinationModelActionResult.destinationRotation,
      this.homeLocation.rotation
    ),
    transitionToNextActionStarted: false,
  };

  while (this.actionResultsQueue.length > 0) {
    const actionResult = this.actionResultsQueue.shift()!;

    if (actionResult.endsTurn) shouldEndTurn = true;

    this.modelActionQueue.push({
      type: CombatantModelActionType.PerformCombatAction,
      actionResult,
    });
  }

  this.modelActionQueue.push(returnHomeModelAction);

  if (shouldEndTurn) this.modelActionQueue.push({ type: CombatantModelActionType.EndTurn });

  this.modelActionQueue.push({ type: CombatantModelActionType.Idle });
}
