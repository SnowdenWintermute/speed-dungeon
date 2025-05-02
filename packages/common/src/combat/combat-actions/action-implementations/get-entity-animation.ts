import { EntityAnimation } from "../../../action-processing/game-update-commands.js";
import { SkeletalAnimationName } from "../../../app-consts.js";
import { CombatantProperties, CombatantSpecies } from "../../../combatants/index.js";
import { HoldableSlotType } from "../../../items/equipment/slots.js";
import { getFallbackAnimationWithLength } from "../combat-action-animations.js";
import { ActionExecutionPhase } from "./action-execution-phase.js";
import { MeleeAttackAnimationType } from "./attack/determine-melee-attack-animation-type.js";
import { MELEE_ATTACK_ANIMATION_NAMES } from "./attack/melee-attack-animation-names.js";

export function getMeleeAttackAnimationFromType(
  user: CombatantProperties,
  animationLengths: Record<CombatantSpecies, Record<string, number>>,
  meleeAttackAnimationType: MeleeAttackAnimationType,
  executionPhase: ActionExecutionPhase,
  slotType: HoldableSlotType
): EntityAnimation {
  const animationName =
    MELEE_ATTACK_ANIMATION_NAMES[meleeAttackAnimationType][slotType][executionPhase];
  return getTimedSkeletalEntityAnimation(user, animationLengths, animationName);
}

export function getTimedSkeletalEntityAnimation(
  user: CombatantProperties,
  animationLengths: Record<CombatantSpecies, Record<string, number>>,
  animationName: SkeletalAnimationName
) {
  const speciesLengths = animationLengths[user.combatantSpecies];
  return getFallbackAnimationWithLength(animationName, speciesLengths);
}
