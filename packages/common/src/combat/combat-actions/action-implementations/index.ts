import { CombatActionComponent, CombatActionName } from "../index.js";
import { ATTACK_MELEE_MAIN_HAND } from "./attack/attack-melee-main-hand.js";
import { ATTACK_MELEE_OFF_HAND } from "./attack/attack-melee-off-hand.js";
import { ATTACK_RANGED_MAIN_HAND } from "./attack/attack-ranged-main-hand.js";
import { ATTACK } from "./attack/index.js";
import { CHAINING_SPLIT_ARROW_PROJECTILE } from "./chaining-split-arrow/chaining-split-arrow-projectile.js";
import { CHAINING_SPLIT_ARROW_PARENT } from "./chaining-split-arrow/index.js";

export const COMBAT_ACTIONS: Record<CombatActionName, CombatActionComponent> = {
  [CombatActionName.Attack]: ATTACK,
  [CombatActionName.AttackMeleeMainhand]: ATTACK_MELEE_MAIN_HAND,
  [CombatActionName.AttackMeleeOffhand]: ATTACK_MELEE_OFF_HAND,
  [CombatActionName.AttackRangedMainhand]: ATTACK_RANGED_MAIN_HAND,
  [CombatActionName.UseGreenAutoinjector]: ATTACK, // @TODO - implement
  [CombatActionName.UseBlueAutoinjector]: ATTACK,
  [CombatActionName.ChainingSplitArrowParent]: CHAINING_SPLIT_ARROW_PARENT,
  [CombatActionName.ChainingSplitArrowProjectile]: CHAINING_SPLIT_ARROW_PROJECTILE,
};
