export type ManagedAnimationOptions = {
  shouldLoop?: boolean;
  animationDurationOverrideOption?: number;
  onComplete?: () => void;
};

export abstract class ManagedAnimation<T> {
  protected timeStarted: number = Date.now();
  weight: number = 0;
  constructor(
    protected animationGroup: T,
    public readonly transitionDuration: number,
    protected options: ManagedAnimationOptions
  ) {}

  abstract setWeight(newWeight: number): void;

  abstract isCompleted(): boolean;

  elapsed() {
    return Date.now() - this.timeStarted;
  }
}

export abstract class AnimationManager<T> {
  playing: null | ManagedAnimation<T> = null;
  previous: null | ManagedAnimation<T> = null;
  locked: boolean = false;
  constructor() {}

  abstract cloneAnimation(animationGroup: T): T;

  abstract startAnimationWithTransition(
    newAnimationName: number,
    transitionDuration: number,
    options?: ManagedAnimationOptions
  ): void;

  abstract stepAnimationTransitionWeights(): Error | void;

  abstract handleCompletedAnimations(): void;

  abstract getAnimationGroupByName(name: number): T | undefined;

  abstract getFallbackAnimationName(name: number): number | undefined;
}
