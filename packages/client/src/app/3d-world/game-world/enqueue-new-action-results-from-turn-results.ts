import { ERROR_MESSAGES } from "@speed-dungeon/common";
import { GameWorld } from ".";
import { CombatantModelActionType } from "../combatant-models/model-actions";

export default function enqueueNewActionResultsFromTurnResults(this: GameWorld) {
  if (this.turnResultsQueue.length === 0) return;

  // check if all combatant model's active model actions are just Idle
  let readyToProcessNextTurn = true;
  for (const combatantModel of Object.values(this.modelManager.combatantModels)) {
    if (
      combatantModel.activeModelActions[CombatantModelActionType.Idle] === undefined ||
      combatantModel.modelActionQueue.length > 0
    ) {
      readyToProcessNextTurn = false;
      break;
    }
  }
  if (!readyToProcessNextTurn) return;

  const newTurnResult = this.turnResultsQueue.shift();

  console.log("remaining turn results: ", this.turnResultsQueue);

  if (newTurnResult === undefined) return new Error(ERROR_MESSAGES.CHECKED_EXPECTATION_FAILED);

  const combatantModelOption = this.modelManager.combatantModels[newTurnResult.combatantId];
  if (combatantModelOption === undefined)
    return new Error(ERROR_MESSAGES.GAME_WORLD.NO_COMBATANT_MODEL);

  combatantModelOption.actionResultsQueue.push(...newTurnResult.actionResults);
}
