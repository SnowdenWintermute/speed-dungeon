import { MutateState } from "@/stores/mutate-state";
import { GameWorld } from "../../game-world";
import { ModularCharacter } from "../modular-character";
import { GameState } from "@/stores/game-store";
import { CombatantModelActionType } from "../model-actions";
import approachDestinationModelActionProcessor from "./approach-destination";

export default function processActiveModelActions(
  this: ModularCharacter,
  gameWorld: GameWorld,
  mutateGameState: MutateState<GameState>
) {
  for (const activeModelAction of Object.values(this.activeModelActions)) {
    switch (activeModelAction.modelAction.type) {
      case CombatantModelActionType.ApproachDestination:
        approachDestinationModelActionProcessor(this, activeModelAction);
      case CombatantModelActionType.ReturnHome:
      case CombatantModelActionType.TurnToTowardTarget:
      case CombatantModelActionType.PerformCombatAction:
      case CombatantModelActionType.HitRecovery:
      case CombatantModelActionType.Evade:
      case CombatantModelActionType.Death:
      case CombatantModelActionType.Idle:
    }
  }
}
