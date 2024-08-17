import { ModularCharacter } from "../combatant-models/modular-character";
import { GameWorld } from ".";
import createApproachDestinationModelAction from "./create-approach-destination-model-action";
import { CombatantModelActionType } from "../combatant-models/model-actions";

export default function enqueueNewModelActionsFromActionResults(
  this: ModularCharacter,
  gameWorld: GameWorld
) {
  let i = 0;
  while (this.actionResultsQueue.length > 0) {
    console.log("enqueuing model action");
    const actionResult = this.actionResultsQueue.shift()!;
    if (i === 0) {
      const approachDestinationModelActionResult = createApproachDestinationModelAction(
        gameWorld,
        this,
        actionResult
      );
      if (approachDestinationModelActionResult instanceof Error)
        return approachDestinationModelActionResult;
      this.modelActionQueue.push(approachDestinationModelActionResult);
    }

    this.modelActionQueue.push({
      type: CombatantModelActionType.PerformCombatAction,
      actionResult,
    });

    i += 1;
  }
}
