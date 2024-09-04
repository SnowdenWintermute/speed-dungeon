import {
  CombatantModelAction,
  CombatantModelActionProgressTracker,
  CombatantModelActionType,
} from "./model-actions";
import { ModularCharacter } from "../modular-character";
import approachDestinationModelActionProcessor from "./approach-destination-model-action-processor";

export class ModelActionManager {
  activeModelActionTracker: null | CombatantModelActionProgressTracker = null;
  constructor(public combatantModel: ModularCharacter) {}

  startNewModelAction(newModelAction: CombatantModelAction) {
    this.activeModelActionTracker = new CombatantModelActionProgressTracker(newModelAction);
  }

  processActiveModelAction() {
    if (!this.activeModelActionTracker) return;

    switch (this.activeModelActionTracker.modelAction.type) {
      case CombatantModelActionType.ApproachDestination:
        approachDestinationModelActionProcessor(this.combatantModel, this.activeModelActionTracker);
        break;
      case CombatantModelActionType.TurnToTowardTarget:
        break;
    }
  }

  removeActiveModelAction() {
    this.activeModelActionTracker = null;
  }
}
