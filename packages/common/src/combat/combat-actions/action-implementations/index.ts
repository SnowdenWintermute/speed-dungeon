import { CombatActionComponent, CombatActionName } from "../index.js";
import { ATTACK_MELEE_MAIN_HAND } from "./attack/attack-melee-main-hand.js";
import { ATTACK_MELEE_OFF_HAND } from "./attack/attack-melee-off-hand.js";
import { ATTACK_RANGED_MAIN_HAND_PROJECTILE } from "./attack/attack-ranged-main-hand-projectile.js";
import { ATTACK_RANGED_MAIN_HAND } from "./attack/attack-ranged-main-hand.js";
import { ATTACK } from "./attack/index.js";
import { CHAINING_SPLIT_ARROW_PROJECTILE } from "./chaining-split-arrow/chaining-split-arrow-projectile.js";
import { CHAINING_SPLIT_ARROW_PARENT } from "./chaining-split-arrow/index.js";
import { USE_BLUE_AUTOINJECTOR } from "./consumables/blue-autoinjector.js";
import { USE_GREEN_AUTOINJECTOR } from "./consumables/green-autoinjector.js";
import { EXPLODING_ARROW_PROJECTILE } from "./exploding-arrow/exploding-arrow-projectile.js";
import { EXPLODING_ARROW_PARENT } from "./exploding-arrow/index.js";
import { EXPLOSION } from "./explosion/index.js";
import { ICE_BOLT_PARENT } from "./ice-bolt/index.js";
import { ICE_BOLT_PROJECTILE } from "./ice-bolt/ice-bolt-projectile.js";
import { ICE_BURST } from "./ice-burst/index.js";
import { COUNTER_ATTACK } from "./counter-attack/index.js";
import { COUNTER_ATTACK_MELEE_MAIN_HAND } from "./counter-attack/counter-attack-melee-main-hand.js";
import { COUNTER_ATTACK_RANGED_MAIN_HAND } from "./counter-attack/counter-attack-ranged-main-hand.js";
import { COUNTER_ATTACK_RANGED_MAIN_HAND_PROJECTILE } from "./counter-attack/counter-attack-ranged-main-hand-projectile.js";
import { FIRE } from "./fire/index.js";
import { BURNING_TICK } from "./burning-tick/index.js";
import { PASS_TURN } from "./pass-turn/index.js";
import { HEALING } from "./healing/index.js";

export const COMBAT_ACTIONS: Record<CombatActionName, CombatActionComponent> = {
  [CombatActionName.Attack]: ATTACK,
  [CombatActionName.AttackMeleeMainhand]: ATTACK_MELEE_MAIN_HAND,
  [CombatActionName.AttackMeleeOffhand]: ATTACK_MELEE_OFF_HAND,
  [CombatActionName.AttackRangedMainhand]: ATTACK_RANGED_MAIN_HAND,
  [CombatActionName.AttackRangedMainhandProjectile]: ATTACK_RANGED_MAIN_HAND_PROJECTILE,
  [CombatActionName.CounterAttackRangedMainhandProjectile]:
    COUNTER_ATTACK_RANGED_MAIN_HAND_PROJECTILE,
  [CombatActionName.Counterattack]: COUNTER_ATTACK,
  [CombatActionName.CounterattackMeleeMainhand]: COUNTER_ATTACK_MELEE_MAIN_HAND,
  [CombatActionName.CounterattackRangedMainhand]: COUNTER_ATTACK_RANGED_MAIN_HAND,
  [CombatActionName.UseGreenAutoinjector]: USE_GREEN_AUTOINJECTOR,
  [CombatActionName.UseBlueAutoinjector]: USE_BLUE_AUTOINJECTOR,
  [CombatActionName.ChainingSplitArrowParent]: CHAINING_SPLIT_ARROW_PARENT,
  [CombatActionName.ChainingSplitArrowProjectile]: CHAINING_SPLIT_ARROW_PROJECTILE,
  [CombatActionName.ExplodingArrowParent]: EXPLODING_ARROW_PARENT,
  [CombatActionName.ExplodingArrowProjectile]: EXPLODING_ARROW_PROJECTILE,
  [CombatActionName.Explosion]: EXPLOSION,
  [CombatActionName.IceBoltParent]: ICE_BOLT_PARENT,
  [CombatActionName.IceBoltProjectile]: ICE_BOLT_PROJECTILE,
  [CombatActionName.IceBurst]: ICE_BURST,
  [CombatActionName.Fire]: FIRE,
  [CombatActionName.Healing]: HEALING,
  [CombatActionName.BurningTick]: BURNING_TICK,
  [CombatActionName.PassTurn]: PASS_TURN,
};
