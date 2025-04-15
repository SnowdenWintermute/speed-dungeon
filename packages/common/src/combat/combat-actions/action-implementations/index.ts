import { CombatActionComponent, CombatActionName } from "../index.js";
import { ATTACK_MELEE_MAIN_HAND } from "./attack/attack-melee-main-hand.js";
import { ATTACK_MELEE_OFF_HAND } from "./attack/attack-melee-off-hand.js";
import { ATTACK_RANGED_MAIN_HAND_PROJECTILE } from "./attack/attack-ranged-main-hand-projectile.js";
import { ATTACK_RANGED_MAIN_HAND } from "./attack/attack-ranged-main-hand.js";
import { ATTACK } from "./attack/index.js";
import { CHAINING_SPLIT_ARROW_PROJECTILE } from "./chaining-split-arrow/chaining-split-arrow-projectile.js";
import { CHAINING_SPLIT_ARROW_PARENT } from "./chaining-split-arrow/index.js";
import { USE_GREEN_AUTOINJECTOR } from "./consumables/green-autoinjector.js";
import { EXPLODING_ARROW_PROJECTILE } from "./exploding-arrow/exploding-arrow-projectile.js";
import { EXPLODING_ARROW_PARENT } from "./exploding-arrow/index.js";
import { EXPLOSION } from "./explosion/index.js";

export const COMBAT_ACTIONS: Record<CombatActionName, CombatActionComponent> = {
  [CombatActionName.Attack]: ATTACK,
  [CombatActionName.AttackMeleeMainhand]: ATTACK_MELEE_MAIN_HAND,
  [CombatActionName.AttackMeleeOffhand]: ATTACK_MELEE_OFF_HAND,
  [CombatActionName.AttackRangedMainhand]: ATTACK_RANGED_MAIN_HAND,
  [CombatActionName.AttackRangedMainhandProjectile]: ATTACK_RANGED_MAIN_HAND_PROJECTILE,
  [CombatActionName.UseGreenAutoinjector]: USE_GREEN_AUTOINJECTOR,
  [CombatActionName.UseBlueAutoinjector]: ATTACK, // @TODO - implement
  [CombatActionName.ChainingSplitArrowParent]: CHAINING_SPLIT_ARROW_PARENT,
  [CombatActionName.ChainingSplitArrowProjectile]: CHAINING_SPLIT_ARROW_PROJECTILE,
  [CombatActionName.ExplodingArrowParent]: EXPLODING_ARROW_PARENT,
  [CombatActionName.ExplodingArrowProjectile]: EXPLODING_ARROW_PROJECTILE,
  [CombatActionName.Explosion]: EXPLOSION,
};
