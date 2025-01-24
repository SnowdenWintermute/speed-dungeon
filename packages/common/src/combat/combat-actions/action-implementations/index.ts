import { CombatActionComponent, CombatActionName } from "../index.js";
import { ATTACK_MELEE_MAIN_HAND } from "./attack/attack-melee-main-hand.js";
import { ATTACK_MELEE_OFF_HAND } from "./attack/attack-melee-off-hand.js";
import { ATTACK_RANGED_MAIN_HAND } from "./attack/attack-ranged-main-hand.js";
import { ATTACK } from "./attack/index.js";

export const COMBAT_ACTIONS: Partial<Record<CombatActionName, CombatActionComponent>> = {
  [CombatActionName.Attack]: ATTACK,
  [CombatActionName.AttackMeleeMainhand]: ATTACK_MELEE_MAIN_HAND,
  [CombatActionName.AttackMeleeOffhand]: ATTACK_MELEE_OFF_HAND,
  [CombatActionName.AttackRangedMainhand]: ATTACK_RANGED_MAIN_HAND,
};
