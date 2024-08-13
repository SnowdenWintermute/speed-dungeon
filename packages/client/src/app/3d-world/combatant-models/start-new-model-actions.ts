import { MutateState } from "@/stores/mutate-state";
import getModelActionAnimationName from "./get-model-action-animation-name";
import { CombatantModelActionProgressTracker, CombatantModelActionType } from "./model-actions";
import { ModularCharacter } from "./modular-character";
import { GameState } from "@/stores/game-store";

export default function startNewModelActions(
  this: ModularCharacter,
  mutateGameState: MutateState<GameState>
) {
  const readyToStartNewActions =
    Object.values(this.activeModelActions).length === 0 ||
    this.activeModelActions[CombatantModelActionType.Idle];

  if (readyToStartNewActions && this.modelActionQueue.length > 0) {
    // put new action progress tracken in active actions object
    const newModelAction = this.modelActionQueue.shift()!;
    this.activeModelActions[newModelAction.type] = new CombatantModelActionProgressTracker(
      newModelAction
    );
    // start animation if any
    let isRepeatingAnimation = false;
    switch (newModelAction.type) {
      case CombatantModelActionType.ApproachDestination:
      case CombatantModelActionType.ReturnHome:
      case CombatantModelActionType.Idle:
        isRepeatingAnimation = true;
      default:
        isRepeatingAnimation = false;
    }

    const animationName = getModelActionAnimationName(
      newModelAction,
      this.entityId,
      mutateGameState
    );
    //
  } else if (!this.modelActionQueue[CombatantModelActionType.Idle]) {
    // start idling if not already doing so
  }
}
