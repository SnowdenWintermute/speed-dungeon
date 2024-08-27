import { GameWorld } from "../../game-world";
import { ModularCharacter } from "../modular-character";
import { CombatantModelActionType } from "../model-actions";
import approachDestinationModelActionProcessor from "./approach-destination";
import endTurnModelActionProcessor from "./end-turn";

export default function processActiveModelActions(this: ModularCharacter, gameWorld: GameWorld) {
  for (const activeModelAction of Object.values(this.activeModelActions)) {
    switch (activeModelAction.modelAction.type) {
      case CombatantModelActionType.ApproachDestination:
      case CombatantModelActionType.ReturnHome:
        approachDestinationModelActionProcessor(this, activeModelAction);
        break;
      case CombatantModelActionType.Death:
      case CombatantModelActionType.TurnToTowardTarget:
      case CombatantModelActionType.PerformCombatAction:
      case CombatantModelActionType.HitRecovery:
      case CombatantModelActionType.Evade:
        if (activeModelAction.animationEnded)
          this.removeActiveModelAction(activeModelAction.modelAction.type);
        break;
      case CombatantModelActionType.EndTurn:
        endTurnModelActionProcessor(this, gameWorld);
        break;
      case CombatantModelActionType.Idle:
        break;
    }
  }
}
