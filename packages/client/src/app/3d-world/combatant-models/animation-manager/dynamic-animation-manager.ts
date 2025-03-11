import { ISceneLoaderAsyncResult } from "@babylonjs/core";
import { AnimationManager, ManagedAnimation, ManagedAnimationOptions } from ".";
import {
  SkeletalAnimationName,
  DynamicAnimationName,
  MISSING_ANIMATION_DEFAULT_ACTION_FALLBACK_TIME,
} from "@speed-dungeon/common";
import cloneDeep from "lodash.clonedeep";

export abstract class DynamicAnimation {
  protected timeStarted = Date.now();
  public abstract name: string;
  protected abstract duration: number;
  constructor() {}

  getLength() {
    return this.duration;
  }

  clone() {
    console.log("cloning dynamic animation");
    return cloneDeep(this);
  }

  start(shouldLoop: boolean, speedModifier?: number) {}

  abstract animateScene(scene: ISceneLoaderAsyncResult): void;
}

export class ManagedDynamicAnimation extends ManagedAnimation<DynamicAnimation> {
  timeStarted: number = Date.now();
  weight: number = 0;
  eventCompleted: boolean = false;
  constructor(
    public animationGroupOption: null | DynamicAnimation,
    public transitionDuration: number = 0,
    public options: ManagedAnimationOptions
  ) {
    super(animationGroupOption, transitionDuration, options);
  }

  setWeight(newWeight: number) {}

  isCompleted() {
    if (this.options.shouldLoop) return false;
    const timeSinceStarted = Date.now() - this.timeStarted;
    console.log(
      "elapsed: ",
      timeSinceStarted,
      this.animationGroupOption?.getLength() || MISSING_ANIMATION_DEFAULT_ACTION_FALLBACK_TIME
    );

    if (!this.animationGroupOption)
      return timeSinceStarted >= MISSING_ANIMATION_DEFAULT_ACTION_FALLBACK_TIME;

    return timeSinceStarted >= Math.floor(this.animationGroupOption.getLength());
  }
}

export class DynamicAnimationManager implements AnimationManager<DynamicAnimation> {
  playing: null | ManagedDynamicAnimation = null;
  previous: null | ManagedDynamicAnimation = null;
  locked: boolean = false;
  constructor(public scene: ISceneLoaderAsyncResult) {
    // stop default animation
  }

  cloneAnimationOption(
    animationGroupOption: undefined | DynamicAnimation
  ): null | DynamicAnimation {
    return animationGroupOption?.clone() ?? null;
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

    const clonedAnimationOption = this.cloneAnimationOption(newAnimationGroupOption);

    this.playing = new ManagedDynamicAnimation(clonedAnimationOption, transitionDuration, options);

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

  cleanUpFinishedAnimation(managedAnimation: ManagedDynamicAnimation) {
    const { onComplete } = managedAnimation.options;
    onComplete();
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
    return DYNAMIC_ANIMATION_CREATORS[animationName]();
  }

  getFallbackAnimationName(animationName: SkeletalAnimationName) {
    return undefined;
  }
}

export const DYNAMIC_ANIMATION_NAME_STRINGS: Record<DynamicAnimationName, string> = {
  [DynamicAnimationName.ExplosionDelivery]: "explosion delivery",
  [DynamicAnimationName.ExplosionDissipation]: "explosion delivery",
};

export class ExplosionDeliveryAnimation extends DynamicAnimation {
  name = DYNAMIC_ANIMATION_NAME_STRINGS[DynamicAnimationName.ExplosionDelivery];
  duration = 2000;
  constructor() {
    super();
  }
  animateScene(scene: ISceneLoaderAsyncResult) {
    const parentMesh = scene.meshes[0];
    if (!parentMesh) {
      return console.error("expected mesh not found in dynamic animation");
    }
    const elapsed = Date.now() - this.timeStarted;
    const percentCompleted = elapsed / this.duration;
    console.log("percentCompleted: ", percentCompleted);
    parentMesh.scaling = parentMesh.scaling.scale(1 + percentCompleted);
  }
}

export class ExplosionDissipationAnimation extends DynamicAnimation {
  name = DYNAMIC_ANIMATION_NAME_STRINGS[DynamicAnimationName.ExplosionDelivery];
  duration = 2000;
  constructor() {
    super();
  }
  animateScene(scene: ISceneLoaderAsyncResult) {
    //
  }
}

export const DYNAMIC_ANIMATION_CREATORS: Record<DynamicAnimationName, () => DynamicAnimation> = {
  [DynamicAnimationName.ExplosionDelivery]: () => new ExplosionDeliveryAnimation(),
  [DynamicAnimationName.ExplosionDissipation]: () => new ExplosionDissipationAnimation(),
};
