import { MutateState } from "@/stores/mutate-state";
import getModelActionAnimationName from "./get-model-action-animation-name";
import { CombatantModelActionProgressTracker, CombatantModelActionType } from "./model-actions";
import { ModularCharacter } from "./modular-character";
import { GameState } from "@/stores/game-store";
import { setDebugMessage } from "@/stores/game-store/babylon-controlled-combatant-data";

export default function startNewModelActions(
  this: ModularCharacter,
  mutateGameState: MutateState<GameState>
) {
  const readyToStartNewActions =
    Object.values(this.activeModelActions).length === 0 ||
    this.activeModelActions[CombatantModelActionType.Idle];

  if (readyToStartNewActions && this.modelActionQueue.length > 0) {
    delete this.activeModelActions[CombatantModelActionType.Idle];
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

    const animationNameResult = getModelActionAnimationName(
      newModelAction,
      this.entityId,
      mutateGameState
    );

    if (animationNameResult instanceof Error) return animationNameResult;
    const animationGroup = this.animationManager.getAnimationGroupByName(animationNameResult || "");

    if (animationGroup !== undefined) {
      this.animationManager.startAnimationWithTransition(animationGroup, 1000, {
        shouldLoop: true,
      });
    } else {
      setDebugMessage(
        mutateGameState,
        this.entityId,
        `Missing animation: ${animationNameResult}`,
        5000
      );
    }
  } else if (
    this.modelActionQueue.length === 0 &&
    this.modelActionQueue[CombatantModelActionType.Idle] === undefined
  ) {
    // // start idling if not already doing so
    // if (this.activeModelActions[CombatantModelActionType.Idle] === undefined) {
    //   this.activeModelActions[CombatantModelActionType.Idle] =
    //     new CombatantModelActionProgressTracker({ type: CombatantModelActionType.Idle });
    //   const animationGroup = this.animationManager.getAnimationGroupByName("idle");
    //   if (animationGroup !== undefined)
    //     this.animationManager.startAnimationWithTransition(animationGroup, 1000, {
    //       shouldLoop: true,
    //     });
    //   else setDebugMessage(mutateGameState, this.entityId, `Missing animation: idle`, 5000);
    // }
  }
}
