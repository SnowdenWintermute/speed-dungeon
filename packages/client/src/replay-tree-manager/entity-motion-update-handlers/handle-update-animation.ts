import { DynamicAnimationManager } from "@/game-world-view/scene-entities/model-animation-managers/dynamic-animation-manager";
import { SkeletalAnimationManager } from "@/game-world-view/scene-entities/model-animation-managers/skeletal-animation-manager";
import {
  ActionEntityMotionGameUpdateCommand,
  AnimationTimingType,
  CombatantMotionGameUpdateCommand,
  DynamicAnimationName,
  EntityAnimation,
  SkeletalAnimationName,
} from "@speed-dungeon/common";
import { EntityMotionUpdateCompletionTracker } from "./entity-motion-update-completion-tracker";
import { ManagedAnimationOptions } from "@/game-world-view/scene-entities/model-animation-managers";
import { GameUpdateTracker } from "../game-update-tracker";

export function handleUpdateAnimation(
  animationManager: SkeletalAnimationManager | DynamicAnimationManager,
  animation: EntityAnimation,
  updateCompletionTracker: EntityMotionUpdateCompletionTracker,
  gameUpdate: GameUpdateTracker<
    CombatantMotionGameUpdateCommand | ActionEntityMotionGameUpdateCommand
  >,
  onComplete: () => void
) {
  const shouldLoop = animation.timing.type === AnimationTimingType.Looping;
  let animationDurationOverrideOption = undefined;
  if (animation.timing.type === AnimationTimingType.Timed) {
    animationDurationOverrideOption = animation.timing.duration;
  }

  const options: ManagedAnimationOptions = {
    shouldLoop,
    animationDurationOverrideOption,
    onComplete: () => {
      // otherwise looping animation will finish at an arbitrary time and could set an unintended action to complete
      if (animation.timing.type === AnimationTimingType.Looping) {
        return;
      }

      updateCompletionTracker.setAnimationComplete();

      if (updateCompletionTracker.isComplete()) {
        gameUpdate.setAsQueuedToComplete();
      }

      onComplete();
    },
  };

  if (animationManager instanceof SkeletalAnimationManager) {
    if (animationManager.playing?.options.onComplete && !animationManager.playing.onCompleteRan) {
      // @REFACTOR - We're sidestepping a bug here I don't really understand fully:
      // if we don't run the oncomplete for animations that are interrupted
      // it will never unlock the input since we're often relying on those animations'
      // onComplete functions to know when to unlock input
      // if I tried to put this in the animation manager's cleanup we got a heavy recursion
      // lag but not a crash until the next room was explored
      animationManager.playing.runOnComplete();
    }

    animationManager.startAnimationWithTransition(
      animation.name.name as SkeletalAnimationName,
      animation.smoothTransition ? 500 : 200,
      options
    );
  } else {
    animationManager.startAnimationWithTransition(
      animation.name.name as DynamicAnimationName,
      animation.smoothTransition ? 500 : 0,
      {
        ...options,
      }
    );
  }
}
