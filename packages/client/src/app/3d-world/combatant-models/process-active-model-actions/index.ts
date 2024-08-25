import { MutateState } from "@/stores/mutate-state";
import { GameWorld } from "../../game-world";
import { ModularCharacter } from "../modular-character";
import { GameState } from "@/stores/game-store";
import { CombatantModelActionType } from "../model-actions";
import approachDestinationModelActionProcessor from "./approach-destination";
import endTurnModelActionProcessor from "./end-turn";
import { MISSING_ANIMATION_DEFAULT_ACTION_FALLBACK_TIME } from "@speed-dungeon/common";

export default function processActiveModelActions(
  this: ModularCharacter,
  gameWorld: GameWorld,
  mutateGameState: MutateState<GameState>
) {
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
        if (activeModelAction.animationOption && activeModelAction.animationEnded)
          this.removeActiveModelAction(activeModelAction.modelAction.type);
        else if (!activeModelAction.animationOption) {
          const timeElapsed = Date.now() - activeModelAction.timeStarted;
          if (timeElapsed >= MISSING_ANIMATION_DEFAULT_ACTION_FALLBACK_TIME)
            this.removeActiveModelAction(activeModelAction.modelAction.type);
        }
        break;
      case CombatantModelActionType.EndTurn:
        endTurnModelActionProcessor(this, gameWorld);
        break;
      case CombatantModelActionType.Idle:
        break;
    }
  }
}
