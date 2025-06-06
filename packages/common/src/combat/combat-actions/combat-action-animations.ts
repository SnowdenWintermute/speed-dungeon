import {
  AnimationTimingType,
  EntityAnimation,
} from "../../action-processing/game-update-commands.js";
import {
  AnimationType,
  SKELETAL_ANIMATION_NAME_STRINGS,
  SkeletalAnimationName,
} from "../../app-consts.js";

export function getFallbackAnimationWithLength(
  animationName: SkeletalAnimationName,
  speciesAnimations: Record<string, number>,
  smoothTransition: boolean,
  lastTry?: boolean
): EntityAnimation {
  const animationNameString = SKELETAL_ANIMATION_NAME_STRINGS[animationName];
  const animationLengthOption = speciesAnimations[animationNameString];

  let toReturn: EntityAnimation = {
    name: { type: AnimationType.Skeletal, name: animationName },
    timing: {
      type: AnimationTimingType.Timed,
      duration: 0,
    },
    smoothTransition,
  };

  if (animationLengthOption !== undefined || lastTry) {
    if (toReturn.timing.type === AnimationTimingType.Timed)
      toReturn.timing.duration = animationLengthOption || 0;
    return toReturn;
  }

  const chamberingNames = [
    SkeletalAnimationName.MainHandStabChambering,
    SkeletalAnimationName.MainHandSwingChambering,
    SkeletalAnimationName.OffHandStabChambering,
    SkeletalAnimationName.OffHandSwingChambering,
    SkeletalAnimationName.CastSpellChambering,
    SkeletalAnimationName.BowChambering,
  ];
  if (chamberingNames.includes(animationName))
    toReturn = getFallbackAnimationWithLength(
      SkeletalAnimationName.MainHandUnarmedChambering,
      speciesAnimations,
      smoothTransition,
      true
    );
  const deliveryNames = [
    SkeletalAnimationName.MainHandStabDelivery,
    SkeletalAnimationName.MainHandSwingDelivery,
    SkeletalAnimationName.OffHandStabDelivery,
    SkeletalAnimationName.OffHandSwingDelivery,
    SkeletalAnimationName.CastSpellDelivery,
    SkeletalAnimationName.BowDelivery,
  ];

  if (deliveryNames.includes(animationName))
    toReturn = getFallbackAnimationWithLength(
      SkeletalAnimationName.MainHandUnarmedDelivery,
      speciesAnimations,
      smoothTransition,
      true
    );
  const recoveryNames = [
    SkeletalAnimationName.MainHandStabRecovery,
    SkeletalAnimationName.MainHandSwingRecovery,
    SkeletalAnimationName.OffHandStabRecovery,
    SkeletalAnimationName.OffHandSwingRecovery,
    SkeletalAnimationName.CastSpellRecovery,
    SkeletalAnimationName.BowRecovery,
  ];
  if (recoveryNames.includes(animationName))
    toReturn = getFallbackAnimationWithLength(
      SkeletalAnimationName.MainHandUnarmedRecovery,
      speciesAnimations,
      smoothTransition,
      true
    );

  console.log("selected alternative: ", SKELETAL_ANIMATION_NAME_STRINGS[toReturn.name.name]);

  return toReturn;
}
