import { MutateState } from "@/stores/mutate-state";
import { GameWorld } from "../../game-world";
import { ModularCharacter } from "../modular-character";
import { GameState } from "@/stores/game-store";
import { CombatantModelActionType } from "../model-actions";
import approachDestinationModelActionProcessor from "./approach-destination";
import performCombatActionModelActionProcessor from "./perform-combat-action";
import endTurnModelActionProcessor from "./end-turn";
import idleModelActionProcessor from "./idle";

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
      case CombatantModelActionType.TurnToTowardTarget:
        break;
      case CombatantModelActionType.PerformCombatAction:
        performCombatActionModelActionProcessor(this, activeModelAction);
        break;
      case CombatantModelActionType.HitRecovery:
        break;
      case CombatantModelActionType.Evade:
        break;
      case CombatantModelActionType.Death:
        break;
      case CombatantModelActionType.EndTurn:
        endTurnModelActionProcessor(this, gameWorld);
        break;
      case CombatantModelActionType.Idle:
        idleModelActionProcessor(this);
        break;
    }
  }
}
