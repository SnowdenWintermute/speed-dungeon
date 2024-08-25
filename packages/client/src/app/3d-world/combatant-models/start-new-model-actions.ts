import { MutateState } from "@/stores/mutate-state";
import getModelActionAnimationName from "./get-model-action-animation-name";
import {
  CombatantModelAction,
  CombatantModelActionProgressTracker,
  CombatantModelActionType,
} from "./model-actions";
import { ModularCharacter } from "./modular-character";
import { GameState } from "@/stores/game-store";
import { setDebugMessage } from "@/stores/game-store/babylon-controlled-combatant-data";
import setAnimationFrameEvents from "./set-animation-frame-events";
import { MISSING_ANIMATION_DEFAULT_ACTION_FALLBACK_TIME } from "@speed-dungeon/common";

export default function startNewModelActions(
  this: ModularCharacter,
  mutateGameState: MutateState<GameState>
) {
  const readyToStartNewActions =
    Object.values(this.activeModelActions).length === 0 ||
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

  // if (this.entityId === "55" && modelAction.type === CombatantModelActionType.PerformCombatAction)
  //   console.log("starting model action: ", formatCombatModelActionType(modelAction.type));

  // start animation if any
  const isRepeatingAnimation = this.animationManager.isRepeatingAnimation(modelAction.type);

  const animationNameResult = getModelActionAnimationName(
    modelAction,
    this.entityId,
    mutateGameState
  );

  if (animationNameResult instanceof Error) return console.error(animationNameResult);
  let animationGroup = this.animationManager.getAnimationGroupByName(animationNameResult);

  // alternatives to some missing animations
  if (animationGroup === undefined)
    animationGroup = this.animationManager.getFallbackAnimationName(animationNameResult);

  const animationOption = animationGroup?.targetedAnimations[0]?.animation;

  if (animationOption === undefined) this.animationManager.stop();

  // set frame event for attacks/etc
  if (modelAction.type === CombatantModelActionType.PerformCombatAction) {
    const animationEventOptionResult = setAnimationFrameEvents(this.world, modelAction);
    if (animationEventOptionResult instanceof Error) return animationEventOptionResult;

    if (animationOption && animationEventOptionResult) {
      animationOption.addEvent(animationEventOptionResult);
    } else if (!animationOption) {
      // no animation but still need to induce the hit recovery
      setTimeout(() => {
        animationEventOptionResult?.action(animationEventOptionResult?.frame);
      }, MISSING_ANIMATION_DEFAULT_ACTION_FALLBACK_TIME);
    }
  }

  // put new action progress tracker in active actions object
  const modelActionTracker = new CombatantModelActionProgressTracker(
    modelAction,
    animationGroup?.targetedAnimations[0]?.animation ?? null
  );

  this.activeModelActions[modelAction.type] = modelActionTracker;

  if (animationGroup !== undefined && animationNameResult !== null) {
    if (this.entityId === "1") {
      if (animationGroup.name === "melee-attack")
        console.log("STARTING MELEE ATTACK ", this.entityId);
      if (animationGroup.name === "melee-attack-offhand")
        console.log("STARTING OFFHAND MELEE ATTACK ", this.entityId);
    }
    this.animationManager.startAnimationWithTransition(animationGroup, 500, {
      shouldLoop: isRepeatingAnimation,
      shouldRestartIfAlreadyPlaying:
        modelAction.type === CombatantModelActionType.HitRecovery ||
        modelAction.type === CombatantModelActionType.Evade ||
        modelAction.type === CombatantModelActionType.PerformCombatAction,
    });

    if (!isRepeatingAnimation) {
      animationGroup.onAnimationEndObservable.add(
        () => {
          modelActionTracker.animationEnded = true;

          if (modelActionTracker.modelAction.type === CombatantModelActionType.PerformCombatAction)
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
    }
  } else {
    setDebugMessage(
      mutateGameState,
      this.entityId,
      `Missing animation: ${animationNameResult}`,
      MISSING_ANIMATION_DEFAULT_ACTION_FALLBACK_TIME
    );
  }
}
