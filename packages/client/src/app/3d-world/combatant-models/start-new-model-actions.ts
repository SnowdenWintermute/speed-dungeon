import { MutateState } from "@/stores/mutate-state";
import getModelActionAnimationName from "./get-model-action-animation-name";
import { CombatantModelActionProgressTracker, CombatantModelActionType } from "./model-actions";
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
    Object.values(this.activeModelActions).length === 0 &&
    this.activeModelActions[CombatantModelActionType.Idle] === undefined
  ) {
    // idle if there's nothing left to do
    const animationGroup = this.animationManager.getAnimationGroupByName("idle");
    const animationOption = animationGroup?.targetedAnimations[0]?.animation ?? null;

    this.activeModelActions[CombatantModelActionType.Idle] =
      new CombatantModelActionProgressTracker(
        { type: CombatantModelActionType.Idle },
        animationOption
      );
  }
}

export function startNextModelAction(
  this: ModularCharacter,
  mutateGameState: MutateState<GameState>
) {
  if (this.activeModelActions[CombatantModelActionType.Idle])
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
    case CombatantModelActionType.ReturnHome:
    case CombatantModelActionType.Idle:
    case CombatantModelActionType.EndTurn:
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
  let animationGroup = this.animationManager.getAnimationGroupByName(animationNameResult || "");
  // in case they don't have a specific offhand attack anim
  if (!animationGroup && animationNameResult === "melee-attack-offhand")
    animationGroup = this.animationManager.getAnimationGroupByName("melee-attack");

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

  if (animationGroup !== undefined && animationNameResult !== null) {
    this.animationManager.startAnimationWithTransition(animationNameResult, animationGroup, 500, {
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
      mutateGameState((state) => {
        const indexOption = state.babylonControlledCombatantDOMData[
          this.entityId
        ]?.activeModelActions.indexOf(newModelAction.type);
        if (indexOption !== undefined) {
          state.babylonControlledCombatantDOMData[this.entityId]?.activeModelActions.splice(
            indexOption,
            1
          );
        }
      });
    }, 5000);
  }
}
