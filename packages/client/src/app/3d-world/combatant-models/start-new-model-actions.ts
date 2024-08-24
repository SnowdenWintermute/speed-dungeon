import { MutateState } from "@/stores/mutate-state";
import getModelActionAnimationName from "./get-model-action-animation-name";
import {
  CombatantModelAction,
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
    if (this.activeModelActions[CombatantModelActionType.Idle])
      this.removeActiveModelAction(CombatantModelActionType.Idle);

    const newModelAction = this.modelActionQueue.shift();
    if (newModelAction === undefined) return new Error("no model action to start");

    this.startModelAction(mutateGameState, newModelAction);
  } else if (
    Object.values(this.activeModelActions).length === 0 &&
    this.activeModelActions[CombatantModelActionType.Idle] === undefined
  ) {
    // idle if there's nothing left to do
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
  mutateGameState((state) => {
    const gameStateActiveActions = state.babylonControlledCombatantDOMData[this.entityId];
    gameStateActiveActions?.activeModelActions.push(modelAction.type);
  });

  if (this.entityId === "55")
    console.log("starting model action: ", formatCombatModelActionType(modelAction.type));

  // start animation if any
  let isRepeatingAnimation = false;
  switch (modelAction.type) {
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
    modelAction,
    this.entityId,
    mutateGameState
  );

  if (animationNameResult instanceof Error) return animationNameResult;
  let animationGroup = this.animationManager.getAnimationGroupByName(animationNameResult);

  // alternatives to some missing animations
  if (animationGroup === undefined && animationNameResult === "melee-attack-offhand") {
    animationGroup = this.animationManager.getAnimationGroupByName("melee-attack");
    if (this.entityId === "55") console.log("changed offhand to melee-attack: ", animationGroup);
  }
  if (animationGroup === undefined && animationNameResult === "move-back") {
    animationGroup = this.animationManager.getAnimationGroupByName("move-forward");
  }

  const animationOption = animationGroup?.targetedAnimations[0]?.animation;

  // set frame event for attacks/etc
  if (animationOption && modelAction.type === CombatantModelActionType.PerformCombatAction) {
    const animationEventOptionResult = setAnimationFrameEvents(this.world, modelAction);
    if (animationEventOptionResult instanceof Error) return animationEventOptionResult;
    if (animationEventOptionResult) animationOption.addEvent(animationEventOptionResult);
  }

  // put new action progress tracker in active actions object
  const animationTracker = new CombatantModelActionProgressTracker(
    modelAction,
    animationGroup?.targetedAnimations[0]?.animation ?? null
  );

  this.activeModelActions[modelAction.type] = animationTracker;

  if (animationGroup !== undefined && animationNameResult !== null) {
    this.animationManager.startAnimationWithTransition(animationNameResult, animationGroup, 500, {
      shouldLoop: isRepeatingAnimation,
      shouldRestartIfAlreadyPlaying:
        modelAction.type === CombatantModelActionType.HitRecovery ||
        modelAction.type === CombatantModelActionType.Evade,
    });

    animationGroup.onAnimationEndObservable.add(
      () => {
        animationTracker.animationEnded = true;

        // otherwise animation events will trigger on subsequent plays of the animation
        animationGroup.targetedAnimations[0]?.animation.getEvents().forEach((event) => {
          animationGroup.targetedAnimations[0]?.animation.removeEvents(event.frame);
        });
      },
      undefined,
      true,
      undefined,
      true
    );
  } else {
    setDebugMessage(
      mutateGameState,
      this.entityId,
      `Missing animation: ${animationNameResult}`,
      2000
    );
  }
}
