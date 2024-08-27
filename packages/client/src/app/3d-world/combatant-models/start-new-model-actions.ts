import { MutateState } from "@/stores/mutate-state";
import { AnimationEvent } from "babylonjs";
import getModelActionAnimationName from "./get-model-action-animation-name";
import {
  CombatantModelAction,
  CombatantModelActionProgressTracker,
  CombatantModelActionType,
} from "./model-actions";
import { ModularCharacter } from "./modular-character";
import { GameState } from "@/stores/game-store";
import getAnimationFrameEvents from "./set-animation-frame-events";

export default function startNewModelActions(
  this: ModularCharacter,
  mutateGameState: MutateState<GameState>
) {
  const readyToStartNewActions =
    this.activeModelActions[CombatantModelActionType.Idle] !== undefined;

  if (readyToStartNewActions && this.modelActionQueue.length > 0) {
    if (this.activeModelActions[CombatantModelActionType.Idle])
      this.removeActiveModelAction(CombatantModelActionType.Idle);

    const newModelAction = this.modelActionQueue.shift();
    if (newModelAction === undefined) return console.error(new Error("no model action to start"));

    this.startModelAction(mutateGameState, newModelAction);
  } else if (
    Object.values(this.activeModelActions).length === 0 &&
    this.activeModelActions[CombatantModelActionType.Idle] === undefined
  ) {
    // idle if there's nothing left to do
    if (this.entityId === "55") console.log("idling for lack of somethin better to do");
    this.startModelAction(mutateGameState, {
      type: CombatantModelActionType.Idle,
    });
  }
}

export function startModelAction(
  this: ModularCharacter,
  mutateGameState: MutateState<GameState>,
  modelAction: CombatantModelAction
) {
  if (this.entityId === "55" && modelAction.type === CombatantModelActionType.Idle)
    console.log("STARTED IDLE MODEL ACTION");
  mutateGameState((state) => {
    const gameStateActiveActions = state.babylonControlledCombatantDOMData[this.entityId];
    gameStateActiveActions?.activeModelActions.push(modelAction.type);
  });

  // start animation if any
  const isRepeatingAnimation = this.animationManager.isRepeatingAnimation(modelAction.type);

  const animationNameResult = getModelActionAnimationName(
    modelAction,
    this.entityId,
    mutateGameState
  );

  if (animationNameResult instanceof Error) return console.error(animationNameResult);
  const newAnimationName = animationNameResult;

  // set frame event for attacks/etc
  let animationEventOption: null | AnimationEvent = null;
  if (modelAction.type === CombatantModelActionType.PerformCombatAction) {
    const animationEventOptionResult = getAnimationFrameEvents(this.world, modelAction);
    if (animationEventOptionResult instanceof Error) return animationEventOptionResult;
    animationEventOption = animationEventOptionResult;
  }

  // put new action progress tracker in active actions object
  const modelActionTracker = new CombatantModelActionProgressTracker(modelAction);

  this.animationManager.startAnimationWithTransition(newAnimationName, 500, {
    shouldLoop: isRepeatingAnimation,
    animationEventOption,
    onComplete: () => {
      modelActionTracker.animationEnded = true;
    },
  });

  this.activeModelActions[modelAction.type] = modelActionTracker;
}
