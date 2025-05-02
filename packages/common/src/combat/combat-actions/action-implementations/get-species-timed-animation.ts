import {
  AnimationTimingType,
  EntityAnimation,
} from "../../../action-processing/game-update-commands.js";
import {
  AnimationType,
  SKELETAL_ANIMATION_NAME_STRINGS,
  SkeletalAnimationName,
} from "../../../app-consts.js";
import { CombatantProperties, CombatantSpecies } from "../../../combatants/index.js";

export function getSpeciesTimedAnimation(
  user: CombatantProperties,
  animationLengths: Record<CombatantSpecies, Record<string, number>>,
  animationName: SkeletalAnimationName
): EntityAnimation {
  const speciesLengths = animationLengths[user.combatantSpecies];
  const animationNameString = SKELETAL_ANIMATION_NAME_STRINGS[animationName];
  const duration = speciesLengths[animationNameString] || 0;

  return {
    name: { type: AnimationType.Skeletal, name: animationName },
    timing: {
      type: AnimationTimingType.Timed,
      duration,
    },
  };
}
