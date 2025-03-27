export type ManagedAnimationOptions = {
  shouldLoop: boolean;
  animationDurationOverrideOption: null | number;
  onComplete: () => void;
};

export abstract class ManagedAnimation<T> {
  timeStarted: number = Date.now();
  weight: number = 0;
  constructor(
    public animationGroupOption: null | T,
    public transitionDuration: number = 0,
    public options: ManagedAnimationOptions
  ) {}

  abstract setWeight(newWeight: number): void;

  abstract isCompleted(): boolean;
}

export abstract class AnimationManager<T> {
  playing: null | ManagedAnimation<T> = null;
  previous: null | ManagedAnimation<T> = null;
  locked: boolean = false;
  constructor() {}

  abstract cloneAnimationOption(animationGroupOption: undefined | T): null | T;

  abstract startAnimationWithTransition(
    newAnimationName: number,
    transitionDuration: number,
    options?: ManagedAnimationOptions
  ): void;

  abstract stepAnimationTransitionWeights(): Error | void;

  abstract cleanUpFinishedAnimation(managedAnimation: ManagedAnimation<T>): void;

  abstract handleCompletedAnimations(): void;

  abstract getAnimationGroupByName(name: number): T | undefined;

  abstract getFallbackAnimationName(name: number): number | undefined;
}
