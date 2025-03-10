import { AnimationGroup, ISceneLoaderAsyncResult } from "@babylonjs/core";
import { AnimationManager, ManagedAnimation, ManagedAnimationOptions } from ".";
import {
  SKELETAL_ANIMATION_NAME_STRINGS,
  SkeletalAnimationName,
  MISSING_ANIMATION_DEFAULT_ACTION_FALLBACK_TIME,
  DynamicAnimationName,
} from "@speed-dungeon/common";
import { setDebugMessage } from "@/stores/game-store/babylon-controlled-combatant-data";

export class DynamicAnimation {
  constructor() {}
}

export class DynamicAnimationManager implements AnimationManager<DynamicAnimation> {
  playing: null | ManagedAnimation = null;
  previous: null | ManagedAnimation = null;
  locked: boolean = false;
  constructor(public scene: ISceneLoaderAsyncResult) {
    // stop default animation
  }

  cloneAnimationOption(animationGroupOption: undefined | AnimationGroup): null | AnimationGroup {
    return animationGroupOption?.clone(animationGroupOption.name, undefined, true) ?? null;
  }

  startAnimationWithTransition(
    newAnimationName: DynamicAnimationName,
    transitionDuration: number,
    options: ManagedAnimationOptions = {
      shouldLoop: true,
      animationEventOption: null,
      animationDurationOverrideOption: null,
      onComplete: () => {},
    }
  ): Error | void {
    if (this.playing !== null) {
      if (this.previous !== null) this.cleanUpFinishedAnimation(this.previous);
      this.previous = this.playing;
      this.playing = null;
    }

    let newAnimationGroupOption = this.getAnimationGroupByName(newAnimationName);
    // alternatives to some missing animations
    if (newAnimationGroupOption === undefined) {
      const fallbackName = this.getFallbackAnimationName(newAnimationName);
      console.log("fallbackName: ", fallbackName);
      if (fallbackName) newAnimationGroupOption = this.getAnimationGroupByName(fallbackName);
    }

    const clonedAnimationOption = this.cloneAnimationOption(newAnimationGroupOption);

    if (clonedAnimationOption === null) {
      // send message to client with timout duration to remove itself
      setDebugMessage(
        this.characterModel.entityId,
        `Missing animation: ${newAnimationName}`,
        MISSING_ANIMATION_DEFAULT_ACTION_FALLBACK_TIME
      );
    }

    this.playing = new ManagedAnimation(clonedAnimationOption, transitionDuration, options);

    if (clonedAnimationOption) {
      if (options.animationDurationOverrideOption) {
        const animationStockDuration = clonedAnimationOption.getLength() * 1000;
        const speedModifier =
          animationStockDuration / (options.animationDurationOverrideOption ?? 1);

        clonedAnimationOption.start(options.shouldLoop, speedModifier);
      } else clonedAnimationOption.start(options.shouldLoop);
    }
  }

  stepAnimationTransitionWeights(): Error | void {
    // if (!this.playing) console.log("no animation played this frame");
    if (!this.playing || this.playing.weight >= 1) return;

    const timeSinceStarted = Date.now() - this.playing.timeStarted;
    let percentTransitionCompleted = timeSinceStarted / this.playing.transitionDuration;
    percentTransitionCompleted = Math.min(1, percentTransitionCompleted);

    this.playing.setWeight(percentTransitionCompleted);
    if (this.previous) this.previous.setWeight(1 - this.playing.weight);
  }

  cleanUpFinishedAnimation(managedAnimation: ManagedAnimation) {
    const { animationEventOption, onComplete } = managedAnimation.options;

    managedAnimation.animationGroupOption?.stop();

    if (animationEventOption && !managedAnimation.eventCompleted) {
      animationEventOption.fn();
    }

    onComplete();

    if (managedAnimation.animationGroupOption)
      // else causes memory leaks
      managedAnimation.animationGroupOption?.dispose();
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

    if (this.playing === null && this.previous === null && !this.locked) {
      console.log("no playing or previous animation");
      // console.log("tried to start idle");
      this.characterModel.startIdleAnimation(500); // circular ref
    }
  }

  getAnimationGroupByName(animationName: SkeletalAnimationName) {
    const asString = SKELETAL_ANIMATION_NAME_STRINGS[animationName];
    const { skeleton } = this.characterModel;
    for (let index = 0; index < skeleton.animationGroups.length; index++) {
      if (!skeleton.animationGroups[index]) continue;
      if (skeleton.animationGroups[index]!.name === asString) {
        return skeleton.animationGroups[index];
      }
    }
  }

  getFallbackAnimationName(animationName: SkeletalAnimationName) {
    // if (animationName === AnimationName.MeleeOffHand) return AnimationName.MeleeMainHand;
    if (animationName === SkeletalAnimationName.MoveBack) return SkeletalAnimationName.MoveForward;
    if (animationName === SkeletalAnimationName.Idle) return SkeletalAnimationName.MoveForward;
  }
}
