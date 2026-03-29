import { AssetContainer } from "@babylonjs/core";
import { SceneEntityAnimationManager, ManagedAnimationOptions } from ".";
import { SkeletalAnimationName, DynamicAnimationName } from "@speed-dungeon/common";
import { DynamicAnimation } from "./dynamic-animation";
import { ManagedDynamicAnimation } from "./managed-dynamic-animation";
import { DynamicAnimantionFactory } from "./dynamic-animation-factory";

export class DynamicAnimationManager implements SceneEntityAnimationManager<DynamicAnimation> {
  playing: null | ManagedDynamicAnimation = null;
  previous: null | ManagedDynamicAnimation = null;
  locked: boolean = false;
  constructor(public assetContainer: AssetContainer) {}
  cloneAnimation(animationGroup: DynamicAnimation): DynamicAnimation {
    return animationGroup.clone();
  }

  startAnimationWithTransition(
    newAnimationName: DynamicAnimationName,
    transitionDuration: number,
    options: ManagedAnimationOptions = { shouldLoop: true }
  ) {
    if (this.playing !== null) {
      if (this.previous !== null) {
        this.cleanUpFinishedAnimation(this.previous);
      }
      this.previous = this.playing;
      this.playing = null;
    }

    const newAnimationGroup = this.getAnimationGroupByName(newAnimationName);
    if (options.animationDurationOverrideOption) {
      newAnimationGroup.setDuration(options.animationDurationOverrideOption);
    }

    const clonedAnimationOption = this.cloneAnimation(newAnimationGroup);

    this.playing = new ManagedDynamicAnimation(clonedAnimationOption, transitionDuration, options);

    if (!clonedAnimationOption) {
      return;
    }

    if (options.animationDurationOverrideOption) {
      const animationStockDuration = clonedAnimationOption.getLength();
      const speedModifier = animationStockDuration / (options.animationDurationOverrideOption ?? 1);

      clonedAnimationOption.start(!!options.shouldLoop, speedModifier);
    } else {
      clonedAnimationOption.start(!!options.shouldLoop);
    }
  }

  stepAnimationTransitionWeights() {
    if (!this.playing || this.playing.weight >= 1) return;

    const timeSinceStarted = Date.now() - this.playing.timeStarted;
    let percentTransitionCompleted = timeSinceStarted / this.playing.transitionDuration;
    percentTransitionCompleted = Math.min(1, percentTransitionCompleted);

    this.playing.setWeight(percentTransitionCompleted);
    if (this.previous) this.previous.setWeight(1 - this.playing.weight);
  }

  cleanUpFinishedAnimation(managedAnimation: ManagedDynamicAnimation) {
    const { onComplete } = managedAnimation.options;
    if (onComplete) onComplete();
    if (managedAnimation.animationGroup.despawnOnComplete) {
      this.assetContainer.dispose();
    }
  }

  handleCompletedAnimations() {
    if (this.previous?.weight === 0) {
      this.cleanUpFinishedAnimation(this.previous);
      this.previous = null;
    }

    if (this.playing && this.playing.isCompleted()) {
      this.cleanUpFinishedAnimation(this.playing);
      this.playing = null;
    }
  }

  getAnimationGroupByName(animationName: DynamicAnimationName) {
    return DynamicAnimantionFactory.create(this.assetContainer, animationName);
  }

  getFallbackAnimationName(animationName: SkeletalAnimationName) {
    return undefined;
  }
}
