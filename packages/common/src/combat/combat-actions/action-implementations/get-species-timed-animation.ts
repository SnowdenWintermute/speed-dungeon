import {
  AnimationTimingType,
  EntityAnimation,
} from "../../../action-processing/game-update-commands.js";
import {
  AnimationType,
  SKELETAL_ANIMATION_NAME_STRINGS,
  SkeletalAnimationName,
} from "../../../app-consts.js";
import { IActionUser } from "../../../combatant-context/action-user.js";
import { CombatantProperties, CombatantSpecies } from "../../../combatants/index.js";

export function getSpeciesTimedAnimation(
  user: IActionUser,
  animationLengths: Record<CombatantSpecies, Record<string, number>>,
  animationName: SkeletalAnimationName,
  smoothTransition: boolean
): EntityAnimation {
  const speciesLengths = animationLengths[user.getCombatantProperties().combatantSpecies];
  const animationNameString = SKELETAL_ANIMATION_NAME_STRINGS[animationName];
  const duration = speciesLengths[animationNameString] || 0;

  return {
    name: { type: AnimationType.Skeletal, name: animationName },
    timing: {
      type: AnimationTimingType.Timed,
      duration,
    },
    smoothTransition,
  };
}
