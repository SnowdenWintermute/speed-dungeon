import { MutateState } from "@/stores/mutate-state";
import getModelActionAnimationName from "./get-model-action-animation-name";
import {
  CombatantModelActionProgressTracker,
  CombatantModelActionType,
  formatCombatModelActionType,
} from "./model-actions";
import { ModularCharacter } from "./modular-character";
import { GameState } from "@/stores/game-store";
import { setDebugMessage } from "@/stores/game-store/babylon-controlled-combatant-data";
import setAnimationFrameEvents from "./set-animation-frame-events";

export default function startNewModelActions(
  this: ModularCharacter,
  mutateGameState: MutateState<GameState>
) {
  const readyToStartNewActions =
    Object.values(this.activeModelActions).length === 0 ||
    this.activeModelActions[CombatantModelActionType.Idle];

  if (readyToStartNewActions && this.modelActionQueue.length > 0) {
    this.startNextModelAction(mutateGameState);
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

export function startNextModelAction(
  this: ModularCharacter,
  mutateGameState: MutateState<GameState>
) {
  this.removeActiveModelAction(CombatantModelActionType.Idle);

  const newModelAction = this.modelActionQueue.shift();
  if (newModelAction === undefined) return new Error("no model action to start");

  mutateGameState((state) => {
    const gameStateActiveActions = state.babylonControlledCombatantDOMData[this.entityId];
    gameStateActiveActions?.activeModelActions.push(newModelAction.type);
  });

  // start animation if any
  let isRepeatingAnimation = false;
  switch (newModelAction.type) {
    case CombatantModelActionType.ApproachDestination:
    case CombatantModelActionType.Idle:
      isRepeatingAnimation = true;
      break;
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

  const animationOption = animationGroup?.targetedAnimations[0]?.animation;

  // set frame event for attacks/etc
  if (animationOption && newModelAction.type === CombatantModelActionType.PerformCombatAction) {
    const animationEventOptionResult = setAnimationFrameEvents(this.world, newModelAction);
    if (animationEventOptionResult instanceof Error) return animationEventOptionResult;
    if (animationEventOptionResult) animationOption.addEvent(animationEventOptionResult);
  }

  // put new action progress tracker in active actions object
  const animationTracker = new CombatantModelActionProgressTracker(
    newModelAction,
    animationGroup?.targetedAnimations[0]?.animation ?? null
  );

  this.activeModelActions[newModelAction.type] = animationTracker;

  if (animationGroup !== undefined) {
    this.animationManager.startAnimationWithTransition(animationGroup, 500, {
      shouldLoop: isRepeatingAnimation,
    });
    animationGroup.onAnimationEndObservable.add(() => {
      animationTracker.animationEnded = true;
    });
  } else {
    setDebugMessage(
      mutateGameState,
      this.entityId,
      `Missing animation: ${animationNameResult}`,
      5000
    );
    setTimeout(() => {
      delete this.activeModelActions[newModelAction.type];
    }, 5000);
  }
}
