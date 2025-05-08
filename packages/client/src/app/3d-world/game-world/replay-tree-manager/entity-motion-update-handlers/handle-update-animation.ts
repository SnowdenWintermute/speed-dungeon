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
  animationOption: EntityAnimation | undefined,
  updateCompletionTracker: EntityMotionUpdateCompletionTracker,
  gameUpdate: {
    command: CombatantMotionGameUpdateCommand | ActionEntityMotionGameUpdateCommand;
    isComplete: boolean;
  },
  instantTransition: boolean,
  onComplete: () => void
) {
  if (!animationOption) return;

  const shouldLoop = animationOption.timing.type === AnimationTimingType.Looping;
  let animationDurationOverrideOption = undefined;
  if (animationOption.timing.type === AnimationTimingType.Timed)
    animationDurationOverrideOption = animationOption.timing.duration;

  const options: ManagedAnimationOptions = {
    shouldLoop,
    animationDurationOverrideOption,
    onComplete: () => {
      // otherwise looping animation will finish at an arbitrary time and could set an unintended action to complete
      if (animationOption.timing.type === AnimationTimingType.Looping) return;
      updateCompletionTracker.setAnimationComplete();
      if (updateCompletionTracker.isComplete()) gameUpdate.isComplete = true;
      onComplete();
    },
  };

  if (animationManager instanceof SkeletalAnimationManager) {
    animationManager.startAnimationWithTransition(
      animationOption.name.name as SkeletalAnimationName,
      instantTransition ? 200 : 500,
      options
    );
  } else {
    animationManager.startAnimationWithTransition(
      animationOption.name.name as DynamicAnimationName,
      instantTransition ? 0 : 500,
      {
        ...options,
      }
    );
  }
}
