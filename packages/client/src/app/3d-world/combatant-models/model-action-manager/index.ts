import { MutateState } from "@/stores/mutate-state";
import { GameState } from "@/stores/game-store";
import {
  CombatantModelAction,
  CombatantModelActionProgressTracker,
  CombatantModelActionType,
} from "./model-actions";
import { ModularCharacter } from "../modular-character";
import { ERROR_MESSAGES } from "@speed-dungeon/common";
import approachDestinationModelActionProcessor from "./approach-destination-model-action-processor";

export class ModelActionManager {
  modelActionQueue: CombatantModelAction[] = [];
  activeModelAction: null | CombatantModelActionProgressTracker = null;
  constructor(public combatantModel: ModularCharacter) {}

  startNewModelActions(mutateGameState: MutateState<GameState>) {
    const readyToStartNewActions = this.activeModelAction === null;
    if (!readyToStartNewActions || this.modelActionQueue.length === 0) return;

    const newModelAction = this.modelActionQueue.shift();
    if (newModelAction === undefined)
      return console.error(new Error(ERROR_MESSAGES.CHECKED_EXPECTATION_FAILED));

    mutateGameState((state) => {
      const gameStateActiveAction =
        state.babylonControlledCombatantDOMData[this.combatantModel.entityId];
      if (gameStateActiveAction) gameStateActiveAction.activeModelAction = newModelAction.type;
    });

    this.activeModelAction = new CombatantModelActionProgressTracker(newModelAction);
  }

  processActiveModelAction() {
    if (!this.activeModelAction) return;

    switch (this.activeModelAction.modelAction.type) {
      case CombatantModelActionType.ApproachDestination:
      case CombatantModelActionType.ReturnHome:
        approachDestinationModelActionProcessor(this.combatantModel, this.activeModelAction);
        break;
      case CombatantModelActionType.TurnToTowardTarget:
        break;
    }
  }

  removeActiveModelAction() {
    this.activeModelAction = null;

    this.combatantModel.world.mutateGameState((state) => {
      if (!this.activeModelAction) return;
      const gameStateActiveAction =
        state.babylonControlledCombatantDOMData[this.combatantModel.entityId];
      if (gameStateActiveAction) gameStateActiveAction.activeModelAction = null;
    });
  }
}
