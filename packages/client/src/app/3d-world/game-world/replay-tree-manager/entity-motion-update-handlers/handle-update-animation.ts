import { DynamicAnimationManager } from "@/app/3d-world/scene-entities/model-animation-managers/dynamic-animation-manager";
import { SkeletalAnimationManager } from "@/app/3d-world/scene-entities/model-animation-managers/skeletal-animation-manager";
import {
  ActionEntityMotionGameUpdateCommand,
  AnimationTimingType,
  CombatantMotionGameUpdateCommand,
  DynamicAnimationName,
  EntityAnimation,
  SkeletalAnimationName,
} from "@speed-dungeon/common";
import { EntityMotionUpdateCompletionTracker } from "./entity-motion-update-completion-tracker";
import { ManagedAnimationOptions } from "@/app/3d-world/scene-entities/model-animation-managers";

export function handleUpdateAnimation(
  animationManager: SkeletalAnimationManager | DynamicAnimationManager,
  animation: EntityAnimation,
  updateCompletionTracker: EntityMotionUpdateCompletionTracker,
  gameUpdate: {
    command: CombatantMotionGameUpdateCommand | ActionEntityMotionGameUpdateCommand;
    isComplete: boolean;
  },
  onComplete: () => void
) {
  const shouldLoop = animation.timing.type === AnimationTimingType.Looping;
  let animationDurationOverrideOption = undefined;
  if (animation.timing.type === AnimationTimingType.Timed)
    animationDurationOverrideOption = animation.timing.duration;

  const options: ManagedAnimationOptions = {
    shouldLoop,
    animationDurationOverrideOption,
    onComplete: () => {
      // otherwise looping animation will finish at an arbitrary time and could set an unintended action to complete
      if (animation.timing.type === AnimationTimingType.Looping) return;
      updateCompletionTracker.setAnimationComplete();

      if (updateCompletionTracker.isComplete()) gameUpdate.isComplete = true;
      onComplete();
    },
  };

  if (animationManager instanceof SkeletalAnimationManager) {
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
