import { AnimationGroup, AssetContainer } from "@babylonjs/core";
import { SceneEntityAnimationManager, ManagedAnimationOptions } from ".";
import {
  DEBUG_ANIMATION_SPEED_MULTIPLIER,
  EntityId,
  ONE_SECOND,
  SKELETAL_ANIMATION_NAME_STRINGS,
  SkeletalAnimationName,
} from "@speed-dungeon/common";
import { ManagedSkeletalAnimation } from "./managed-skeletal-animation";
import { FloatingMessageService } from "@/client-application/event-log/floating-messages-service";

export class SkeletalAnimationManager implements SceneEntityAnimationManager<AnimationGroup> {
  playing: null | ManagedSkeletalAnimation = null;
  previous: null | ManagedSkeletalAnimation = null;
  locked: boolean = false;
  constructor(
    private sceneEntityId: EntityId,
    private assetContainer: AssetContainer,
    private floatingMessagesService: FloatingMessageService
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
  ) {
    const clonedAnimation = this.getClonedAnimation(newAnimationName);

    if (clonedAnimation === undefined) {
      this.floatingMessagesService.startMissingAnimationMessage(
        this.sceneEntityId,
        newAnimationName
      );
      options.onComplete?.();
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

  stepAnimationTransitionWeights() {
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
    for (const animationGroup of skeleton.animationGroups) {
      if (animationGroup.name === asString) {
        return animationGroup;
      }
    }
  }

  getFallbackAnimationName(animationName: SkeletalAnimationName) {
    console.log("fallback for:", SKELETAL_ANIMATION_NAME_STRINGS[animationName]);
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

    if (animationName === SkeletalAnimationName.ThrowObjectChambering) {
      return SkeletalAnimationName.CastSpellChambering;
    }
    if (animationName === SkeletalAnimationName.ThrowObjectDelivery) {
      return SkeletalAnimationName.CastSpellDelivery;
    }
    if (animationName === SkeletalAnimationName.ThrowObjectRecovery) {
      return SkeletalAnimationName.CastSpellRecovery;
    }
  }
}
