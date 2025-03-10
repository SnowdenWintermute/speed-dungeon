import { AnimationGroup, AnimationEvent } from "@babylonjs/core";
import { MISSING_ANIMATION_DEFAULT_ACTION_FALLBACK_TIME } from "@speed-dungeon/common";

export type ManagedAnimationOptions = {
  shouldLoop: boolean;
  animationEventOption: null | { fn: () => void; frame: number };
  animationDurationOverrideOption: null | number;
  onComplete: () => void;
};

export class ManagedAnimation {
  timeStarted: number = Date.now();
  weight: number = 0;
  animationEventOption: null | AnimationEvent = null;
  eventCompleted: boolean = false;
  constructor(
    public animationGroupOption: null | AnimationGroup,
    public transitionDuration: number = 0,
    public options: ManagedAnimationOptions
  ) {
    const { animationEventOption } = options;
    const animation = this.animationGroupOption?.targetedAnimations[0]?.animation;
    if (animation && animationEventOption) {
      const animationEvent = new AnimationEvent(animationEventOption.frame, () => {
        animationEventOption.fn();
        this.eventCompleted = true;
      });
      animationEvent.onlyOnce = true;
      animation.addEvent(animationEvent);
    }
  }

  setWeight(newWeight: number) {
    this.weight = newWeight;
    this.animationGroupOption?.setWeightForAllAnimatables(newWeight);
  }

  isCompleted() {
    if (this.options.shouldLoop) return false;
    const timeSinceStarted = Date.now() - this.timeStarted;
    if (this.animationGroupOption) {
      return timeSinceStarted >= Math.floor(this.animationGroupOption.getLength() * 1000);
    } else {
      return timeSinceStarted >= MISSING_ANIMATION_DEFAULT_ACTION_FALLBACK_TIME;
    }
  }
}

export abstract class AnimationManager<T> {
  playing: null | ManagedAnimation = null;
  previous: null | ManagedAnimation = null;
  locked: boolean = false;
  constructor() {}

  abstract cloneAnimationOption(animationGroupOption: undefined | T): null | T;

  abstract startAnimationWithTransition(
    newAnimationName: number,
    transitionDuration: number,
    options?: ManagedAnimationOptions
  ): void;

  abstract stepAnimationTransitionWeights(): Error | void;

  abstract cleanUpFinishedAnimation(managedAnimation: ManagedAnimation): void;

  abstract handleCompletedAnimations(): void;

  abstract getAnimationGroupByName(name: number): T | undefined;

  abstract getFallbackAnimationName(name: number): number | undefined;
}
