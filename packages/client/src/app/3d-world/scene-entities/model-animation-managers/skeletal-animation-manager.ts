import { AnimationGroup, AssetContainer } from "@babylonjs/core";
import { AnimationManager, ManagedAnimation, ManagedAnimationOptions } from ".";
import {
  DEBUG_ANIMATION_SPEED_MULTIPLIER,
  EntityId,
  MISSING_ANIMATION_DEFAULT_ACTION_FALLBACK_TIME,
  ONE_SECOND,
  SKELETAL_ANIMATION_NAME_STRINGS,
  SkeletalAnimationName,
} from "@speed-dungeon/common";
import { AppStore } from "@/mobx-stores/app-store";
import { FloatingMessageElementType } from "@/mobx-stores/game-event-notifications/floating-messages";

export class ManagedSkeletalAnimation extends ManagedAnimation<AnimationGroup> {
  protected timeStarted: number = Date.now();
  weight: number = 0;
  constructor(
    protected animationGroup: AnimationGroup,
    public readonly transitionDuration: number,
    options: ManagedAnimationOptions
  ) {
    super(animationGroup, transitionDuration, options);
  }

  getName() {
    return this.animationGroup.name;
  }

  getLength() {
    let length = this.animationGroup.getLength() * 1000;
    if (this.options.animationDurationOverrideOption !== undefined)
      length = this.options.animationDurationOverrideOption;

    return length * DEBUG_ANIMATION_SPEED_MULTIPLIER;
  }

  setWeight(newWeight: number) {
    this.weight = newWeight;
    this.animationGroup.setWeightForAllAnimatables(newWeight);
  }

  setToLastFrame() {
    const lastFrame = this.animationGroup.to;
    this.animationGroup.goToFrame(lastFrame);
  }

  isCompleted() {
    if (this.onCompleteRan) {
      return true;
    }

    if (this.options.shouldLoop) {
      return false;
    }

    const timeSinceStarted = Date.now() - this.timeStarted;
    const animationLength = this.getLength();
    return timeSinceStarted >= animationLength;
  }

  runOnComplete() {
    if (this.onCompleteRan) {
      return;
    }
    this.options.onComplete?.();
    this.onCompleteRan = true;
  }

  cleanup() {
    this.animationGroup.stop();
    this.animationGroup.dispose(); // else causes memory leaks

    // if we don't run the oncomplete for animations that are interrupted
    // it will never unlock the input since we're often relying on those animations'
    // onComplete functions to know when to unlock input
    // this.runOnComplete();
  }
}

export class SkeletalAnimationManager implements AnimationManager<AnimationGroup> {
  playing: null | ManagedSkeletalAnimation = null;
  previous: null | ManagedSkeletalAnimation = null;
  locked: boolean = false;
  constructor(
    public sceneEntityId: EntityId,
    public assetContainer: AssetContainer
  ) {
    // stop default animation
    this.assetContainer.animationGroups[0]?.setWeightForAllAnimatables(0);
    this.assetContainer.animationGroups[0]?.stop();
  }

  cloneAnimation(animationGroup: AnimationGroup): AnimationGroup {
    return animationGroup.clone(animationGroup.name, undefined, true);
  }

  setCurrentAnimationToLastFrame() {
    this.playing?.setToLastFrame();
  }

  startAnimationWithTransition(
    newAnimationName: SkeletalAnimationName,
    transitionDuration: number,
    options: ManagedAnimationOptions
  ): Error | void {
    const clonedAnimation = this.getClonedAnimation(newAnimationName);

    if (clonedAnimation === undefined) {
      // send message to client with timout duration to remove itself
      AppStore.get().gameEventNotificationStore.startFloatingMessage(
        this.sceneEntityId,
        [
          {
            type: FloatingMessageElementType.Text,
            text: `Missing animation: ${SKELETAL_ANIMATION_NAME_STRINGS[newAnimationName]}`,
          },
        ],
        MISSING_ANIMATION_DEFAULT_ACTION_FALLBACK_TIME,
        options.onComplete
      );
      return;
    }

    if (this.previous) {
      this.previous.cleanup();
    }

    this.previous = this.playing;

    this.playing = new ManagedSkeletalAnimation(clonedAnimation, transitionDuration, options);

    const animationStockDuration = clonedAnimation.getLength() * ONE_SECOND;
    let speedModifier =
      animationStockDuration / (options.animationDurationOverrideOption || animationStockDuration);

    speedModifier *= 1 / DEBUG_ANIMATION_SPEED_MULTIPLIER;

    const onlyPlayLastFrame = options?.onlyPlayLastFrame;
    if (onlyPlayLastFrame) {
      clonedAnimation.start(
        options.shouldLoop,
        speedModifier,
        clonedAnimation.to,
        clonedAnimation.to
      );
    } else {
      clonedAnimation.start(options.shouldLoop, speedModifier);
    }
  }

  stepAnimationTransitionWeights(): Error | void {
    if (!this.playing) return;

    const length = this.playing.getLength();

    const elapsed = this.playing.elapsed();
    if (elapsed >= length) {
      this.playing.setWeight(1);
      this.previous?.setWeight(0);
      // otherwise it is possible that a short animation would finish
      // before the weight transition, leaving a mismatch in weights for one frame
      // when a subsequent animation is added and the previous animation is still there
      this.previous?.cleanup();
      this.previous = null;
      return;
    }

    let percentTransitionCompleted = elapsed / this.playing.transitionDuration;
    percentTransitionCompleted = Math.min(1, percentTransitionCompleted);

    this.playing.setWeight(percentTransitionCompleted);
    this.previous?.setWeight(1 - percentTransitionCompleted);
  }

  handleCompletedAnimations() {
    if (this.previous?.weight === 0) {
      this.previous.cleanup();
      this.previous = null;
    }

    if (this.playing && this.playing.isCompleted()) {
      console.log(
        "this.playing.onCompleteRan:",
        this.playing.onCompleteRan,
        this.playing.getName()
      );
      this.playing.runOnComplete();
    }
  }

  getClonedAnimation(name: SkeletalAnimationName) {
    let newAnimationGroup = this.getAnimationGroupByName(name);
    // alternatives to some missing animations
    if (newAnimationGroup === undefined) {
      const fallbackName = this.getFallbackAnimationName(name);

      if (fallbackName !== undefined)
        newAnimationGroup = this.getAnimationGroupByName(fallbackName);
    }

    if (newAnimationGroup === undefined) return undefined;
    else return this.cloneAnimation(newAnimationGroup);
  }

  getAnimationGroupByName(animationName: SkeletalAnimationName) {
    const asString = SKELETAL_ANIMATION_NAME_STRINGS[animationName];
    const skeleton = this.assetContainer;
    for (let index = 0; index < skeleton.animationGroups.length; index++) {
      if (!skeleton.animationGroups[index]) continue;
      if (skeleton.animationGroups[index]!.name === asString) {
        return skeleton.animationGroups[index];
      }
    }
  }

  getFallbackAnimationName(animationName: SkeletalAnimationName) {
    // if (animationName === AnimationName.MeleeOffHand) return AnimationName.MeleeMainHand;
    const chamberingNames = [
      SkeletalAnimationName.MainHandStabChambering,
      SkeletalAnimationName.MainHandSwingChambering,
      SkeletalAnimationName.OffHandStabChambering,
      SkeletalAnimationName.OffHandSwingChambering,
      SkeletalAnimationName.CastSpellChambering,
      SkeletalAnimationName.BowChambering,
    ];
    if (chamberingNames.includes(animationName))
      return SkeletalAnimationName.MainHandUnarmedChambering;
    const deliveryNames = [
      SkeletalAnimationName.MainHandStabDelivery,
      SkeletalAnimationName.MainHandSwingDelivery,
      SkeletalAnimationName.OffHandStabDelivery,
      SkeletalAnimationName.OffHandSwingDelivery,
      SkeletalAnimationName.CastSpellDelivery,
      SkeletalAnimationName.BowDelivery,
    ];

    if (deliveryNames.includes(animationName)) {
      return SkeletalAnimationName.MainHandUnarmedDelivery;
    }
    const recoveryNames = [
      SkeletalAnimationName.MainHandStabRecovery,
      SkeletalAnimationName.MainHandSwingRecovery,
      SkeletalAnimationName.OffHandStabRecovery,
      SkeletalAnimationName.OffHandSwingRecovery,
      SkeletalAnimationName.CastSpellRecovery,
      SkeletalAnimationName.BowRecovery,
    ];
    if (recoveryNames.includes(animationName)) {
      return SkeletalAnimationName.MainHandUnarmedRecovery;
    }

    if (animationName === SkeletalAnimationName.MoveBack) {
      return SkeletalAnimationName.MoveForwardLoop;
    }

    const idleAnimationNames = [
      SkeletalAnimationName.IdleUnarmed,
      SkeletalAnimationName.IdleFlying,
      SkeletalAnimationName.IdleBow,
      SkeletalAnimationName.IdleTwoHand,
      SkeletalAnimationName.IdleDualWield,
      SkeletalAnimationName.IdleMainHand,
    ];
    if (idleAnimationNames.includes(animationName)) {
      return SkeletalAnimationName.IdleUnarmed;
    }
  }
}
