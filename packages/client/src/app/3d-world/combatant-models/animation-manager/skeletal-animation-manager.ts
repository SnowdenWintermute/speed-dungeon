import { AnimationGroup } from "@babylonjs/core";
import { AnimationManager, ManagedAnimation, ManagedAnimationOptions } from ".";
import { ModularCharacter } from "../modular-character";
import { SKELETAL_ANIMATION_NAME_STRINGS, SkeletalAnimationName } from "@speed-dungeon/common";

export class ManagedSkeletalAnimation extends ManagedAnimation<AnimationGroup> {
  protected timeStarted: number = Date.now();
  weight: number = 0;
  constructor(
    protected animationGroup: AnimationGroup,
    public readonly transitionDuration: number,
    protected options: ManagedAnimationOptions
  ) {
    super(animationGroup, transitionDuration, options);
  }

  getName() {
    return this.animationGroup.name;
  }

  setWeight(newWeight: number) {
    this.weight = newWeight;
    this.animationGroup.setWeightForAllAnimatables(newWeight);
  }

  isCompleted() {
    if (this.options.shouldLoop) return false;
    const timeSinceStarted = Date.now() - this.timeStarted;
    return timeSinceStarted >= Math.floor(this.animationGroup.getLength() * 1000);
  }

  cleanup() {
    this.options.onComplete();
    this.animationGroup.stop();
    this.animationGroup.dispose(); // else causes memory leaks
  }
}

export class SkeletalAnimationManager implements AnimationManager<AnimationGroup> {
  playing: null | ManagedSkeletalAnimation = null;
  previous: null | ManagedSkeletalAnimation = null;
  locked: boolean = false;
  constructor(public characterModel: ModularCharacter) {
    this.characterModel.skeleton.animationGroups[0]?.stop(); // stop default animation
  }

  cloneAnimation(animationGroup: AnimationGroup): AnimationGroup {
    return animationGroup.clone(animationGroup.name, undefined, true);
  }

  startAnimationWithTransition(
    newAnimationName: SkeletalAnimationName,
    transitionDuration: number,
    options: ManagedAnimationOptions = {
      shouldLoop: true,
      animationDurationOverrideOption: null,
      onComplete: () => {},
    }
  ): Error | void {
    console.log(
      this.characterModel.entityId.slice(0, 4),
      "starting animation",
      SKELETAL_ANIMATION_NAME_STRINGS[newAnimationName]
    );
    if (this.playing !== null) {
      if (this.previous !== null) this.previous.cleanup();
      this.previous = this.playing;
      this.playing = null;
    }

    let newAnimationGroup = this.getAnimationGroupByName(newAnimationName);
    // alternatives to some missing animations
    if (newAnimationGroup === undefined) {
      const fallbackName = this.getFallbackAnimationName(newAnimationName);
      console.log("getting fallback animation", fallbackName);
      if (fallbackName !== undefined)
        newAnimationGroup = this.getAnimationGroupByName(fallbackName);

      if (newAnimationGroup === undefined)
        throw new Error(`no animation found ${SKELETAL_ANIMATION_NAME_STRINGS[newAnimationName]}`);
    }

    const clonedAnimation = this.cloneAnimation(newAnimationGroup);

    this.playing = new ManagedSkeletalAnimation(clonedAnimation, transitionDuration, options);

    if (options.animationDurationOverrideOption) {
      const animationStockDuration = clonedAnimation.getLength() * 1000;
      const speedModifier = animationStockDuration / (options.animationDurationOverrideOption ?? 1);

      // clonedAnimationOption.start(options.shouldLoop, speedModifier);
      clonedAnimation.start(options.shouldLoop, 0.25);
    } else clonedAnimation.start(options.shouldLoop);
  }

  stepAnimationTransitionWeights(): Error | void {
    // if (!this.playing) console.log("no animation played this frame");
    if (!this.playing || this.playing.weight >= 1) return;

    const timeSinceStarted = this.playing.elapsed();
    let percentTransitionCompleted = timeSinceStarted / this.playing.transitionDuration;
    percentTransitionCompleted = Math.min(1, percentTransitionCompleted);

    this.playing.setWeight(percentTransitionCompleted);
    if (this.previous) this.previous.setWeight(1 - this.playing.weight);
  }

  handleCompletedAnimations() {
    if (this.previous?.weight === 0) {
      console.log("removing previous", this.previous.getName());
      this.previous.cleanup();
      this.previous = null;
    }

    if (this.playing && this.playing.isCompleted()) {
      console.log("removing current", this.playing.getName());
      this.playing.cleanup();
      this.playing = null;
    }

    // if (this.playing === null && this.previous === null && !this.locked) {
    //   console.log("starting idle since nothing else to do");
    //   this.characterModel.startIdleAnimation(500); // circular ref
    // }
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
    if (animationName === SkeletalAnimationName.MoveBack)
      return SkeletalAnimationName.MoveForwardLoop;
    const idleAnimationNames = [
      SkeletalAnimationName.IdleUnarmed,
      SkeletalAnimationName.IdleBow,
      SkeletalAnimationName.IdleTwoHand,
      SkeletalAnimationName.IdleDualWield,
      SkeletalAnimationName.IdleMainHand,
    ];
    if (idleAnimationNames.includes(animationName)) return SkeletalAnimationName.IdleUnarmed;
  }
}
