import { EntityAnimation } from "../../../action-processing/game-update-commands.js";
import { SkeletalAnimationName } from "../../../app-consts.js";
import { IActionUser } from "../../../combatant-context/action-user.js";
import { CombatantProperties, CombatantSpecies } from "../../../combatants/index.js";
import { HoldableSlotType } from "../../../items/equipment/slots.js";
import { getFallbackAnimationWithLength } from "../combat-action-animations.js";
import { ActionExecutionPhase } from "./action-execution-phase.js";
import { MeleeAttackAnimationType } from "./attack/determine-melee-attack-animation-type.js";
import { MELEE_ATTACK_ANIMATION_NAMES } from "./attack/melee-attack-animation-names.js";

export function getMeleeAttackAnimationFromType(
  user: IActionUser,
  animationLengths: Record<CombatantSpecies, Record<string, number>>,
  meleeAttackAnimationType: MeleeAttackAnimationType,
  executionPhase: ActionExecutionPhase,
  slotType: HoldableSlotType,
  smoothTransition: boolean
): EntityAnimation {
  const animationName =
    MELEE_ATTACK_ANIMATION_NAMES[meleeAttackAnimationType][slotType][executionPhase];
  return getTimedSkeletalEntityAnimation(user, animationLengths, animationName, smoothTransition);
}

export function getTimedSkeletalEntityAnimation(
  user: IActionUser,
  animationLengths: Record<CombatantSpecies, Record<string, number>>,
  animationName: SkeletalAnimationName,
  smoothTransition: boolean
) {
  const speciesLengths = animationLengths[user.getCombatantProperties().combatantSpecies];
  return getFallbackAnimationWithLength(animationName, speciesLengths, smoothTransition);
}
